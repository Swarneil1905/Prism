"""NL2SQL engine — 4-step pipeline: schema introspection, SQL generation, execution, formatting."""
import sqlite3
import json
import uuid
import os
from pathlib import Path
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.trace import Trace
from app.models.span import Span
import anthropic
from app.core.config import settings

DEMO_DB = Path(__file__).parent.parent.parent / "data" / "demo.db"
MODEL = "claude-haiku-4-5-20251001"

SQL_SYSTEM = (
    "You are a SQL expert. Given a database schema and a natural language question, "
    "return ONLY valid SQL. No explanation, no markdown fencing, no comments."
)

FIX_SYSTEM = (
    "The SQL query below raised an error. Return a corrected SQL query only. "
    "No explanation, no markdown fencing."
)


class NL2SQLService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def _db_path(self, database_url: str | None) -> str:
        return str(DEMO_DB) if not database_url else database_url

    def _introspect(self, db_path: str) -> str:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cur.fetchall()]
        parts = []
        for t in tables:
            cur.execute(f"PRAGMA table_info({t})")
            cols = cur.fetchall()
            col_defs = ", ".join(f"{c[1]} {c[2]}" for c in cols)
            parts.append(f"{t}({col_defs})")
        conn.close()
        return "\n".join(parts)

    def _execute(self, db_path: str, sql: str) -> tuple[list[dict], list[str]]:
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA query_only = 1")
        cur = conn.cursor()
        cur.execute(sql)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchmany(500)]
        conn.close()
        return rows, cols

    async def _save_trace(self, workflow_id: str, question: str) -> Trace:
        trace = Trace(workflow_id=workflow_id, name="nl2sql-query", input=question)
        self.db.add(trace)
        await self.db.commit()
        await self.db.refresh(trace)
        return trace

    async def _save_span(self, trace_id, name, span_type, prompt, response, latency_ms, model=None, input_tokens=None, output_tokens=None, cost_usd=None):
        span = Span(
            trace_id=trace_id, name=name, span_type=span_type,
            model=model, prompt=prompt, response=response,
            latency_ms=latency_ms, input_tokens=input_tokens,
            output_tokens=output_tokens, cost_usd=cost_usd,
            started_at=datetime.utcnow(),
        )
        self.db.add(span)
        await self.db.commit()

    async def run(self, question: str, database_url: str | None = None) -> dict:
        db_path = self._db_path(database_url)
        workflow_id = str(uuid.uuid4())
        t0 = datetime.utcnow()

        # Step 1: schema introspection
        t_schema = datetime.utcnow()
        schema = self._introspect(db_path)
        schema_ms = int((datetime.utcnow() - t_schema).total_seconds() * 1000)

        trace = await self._save_trace(workflow_id, question)
        await self._save_span(trace.id, "schema-introspection", "retrieval", question, schema, schema_ms)

        # Step 2: SQL generation
        t_gen = datetime.utcnow()
        prompt = f"Schema:\n{schema}\n\nQuestion: {question}"
        resp = self.client.messages.create(
            model=MODEL, max_tokens=512, system=SQL_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        sql = resp.content[0].text.strip()
        gen_ms = int((datetime.utcnow() - t_gen).total_seconds() * 1000)
        in_tok = resp.usage.input_tokens
        out_tok = resp.usage.output_tokens
        cost = (in_tok * 0.00025 + out_tok * 0.00125) / 1000
        await self._save_span(trace.id, "sql-generation", "llm", prompt, sql, gen_ms, MODEL, in_tok, out_tok, cost)

        # Step 3: execute (with retry)
        t_exec = datetime.utcnow()
        try:
            rows, cols = self._execute(db_path, sql)
        except Exception as e:
            fix_prompt = f"SQL: {sql}\nError: {e}\nSchema: {schema}"
            fix_resp = self.client.messages.create(
                model=MODEL, max_tokens=512, system=FIX_SYSTEM,
                messages=[{"role": "user", "content": fix_prompt}],
            )
            sql = fix_resp.content[0].text.strip()
            fix_ms = int((datetime.utcnow() - t_exec).total_seconds() * 1000)
            await self._save_span(trace.id, "sql-retry", "llm", fix_prompt, sql, fix_ms, MODEL)
            rows, cols = self._execute(db_path, sql)
        exec_ms = int((datetime.utcnow() - t_exec).total_seconds() * 1000)

        total_ms = int((datetime.utcnow() - t0).total_seconds() * 1000)

        # Patch trace
        trace.output = sql
        trace.ended_at = datetime.utcnow()
        trace.total_latency = total_ms
        trace.total_cost = cost
        await self.db.commit()

        return {
            "trace_id": str(trace.id),
            "sql": sql,
            "rows": rows,
            "columns": cols,
            "latency_ms": total_ms,
            "cost_usd": float(cost),
        }

    async def get_schema(self) -> dict:
        schema = self._introspect(str(DEMO_DB))
        conn = sqlite3.connect(str(DEMO_DB))
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables_info = []
        for (t,) in cur.fetchall():
            cur.execute(f"PRAGMA table_info({t})")
            cols = [{"name": c[1], "type": c[2]} for c in cur.fetchall()]
            tables_info.append({"name": t, "columns": cols})
        conn.close()
        return {"tables": tables_info}

    async def get_history(self) -> dict:
        from sqlalchemy import select
        from app.models.trace import Trace
        q = select(Trace).where(Trace.name == "nl2sql-query").order_by(Trace.started_at.desc()).limit(10)
        rows = (await self.db.execute(q)).scalars().all()
        return {"items": [{"question": r.input, "sql": r.output, "created_at": str(r.started_at)} for r in rows]}
