"""NL2SQL engine — 4-step pipeline: schema introspection, SQL generation, execution, formatting."""
import sqlite3
import re
import uuid
from decimal import Decimal
from pathlib import Path
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.trace import Trace
from app.models.span import Span
import anthropic
from app.core.config import settings
from app.utils.anthropic import response_text


class ExplorerConfigError(Exception):
    """Missing or invalid explorer configuration."""


class ExplorerSqlError(Exception):
    """Generated SQL could not be executed."""


class ExplorerLlmError(Exception):
    """Anthropic API call failed."""

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
    def __init__(self, db: AsyncSession | None = None):
        self.db = db
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def _require_db(self) -> AsyncSession:
        if self.db is None:
            raise RuntimeError("Database session required")
        return self.db

    def _db_path(self, database_url: str | None) -> str:
        return str(DEMO_DB) if not database_url else database_url

    def _clean_sql(self, raw: str) -> str:
        """Strip markdown fencing that LLMs sometimes include in SQL output."""
        text = raw.strip()
        text = re.sub(r'^```(?:sql)?\s*\n?', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\n?```\s*$', '', text)
        return text.strip()

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

    def _ensure_demo_db(self) -> None:
        if not DEMO_DB.exists():
            from data.seed_demo import seed_sqlite
            seed_sqlite()

    def _json_safe(self, value):
        if isinstance(value, Decimal):
            return float(value)
        return value

    def _execute(self, db_path: str, sql: str) -> tuple[list[dict], list[str]]:
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA query_only = 1")
        cur = conn.cursor()
        cur.execute(sql)
        cols = [d[0] for d in cur.description]
        rows = [
            {col: self._json_safe(val) for col, val in zip(cols, row)}
            for row in cur.fetchmany(500)
        ]
        conn.close()
        return rows, cols

    async def _save_trace(self, workflow_id: str, question: str) -> Trace | None:
        if self.db is None:
            return None
        try:
            trace = Trace(workflow_id=workflow_id, name="nl2sql-query", input=question)
            self.db.add(trace)
            await self.db.commit()
            await self.db.refresh(trace)
            return trace
        except Exception:
            await self.db.rollback()
            return None

    async def _save_span(
        self,
        trace_id,
        name,
        span_type,
        prompt,
        response,
        latency_ms,
        model=None,
        input_tokens=None,
        output_tokens=None,
        cost_usd=None,
    ) -> None:
        if self.db is None or trace_id is None:
            return
        try:
            span = Span(
                trace_id=trace_id,
                name=name,
                span_type=span_type,
                model=model,
                prompt=prompt,
                response=response,
                latency_ms=latency_ms,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost_usd,
                started_at=datetime.utcnow(),
            )
            self.db.add(span)
            await self.db.commit()
        except Exception:
            await self.db.rollback()

    def _call_llm(self, system: str, user_prompt: str):
        if not settings.anthropic_api_key:
            raise ExplorerConfigError(
                "ANTHROPIC_API_KEY is not configured. Add it to the API service environment variables."
            )
        try:
            return self.client.messages.create(
                model=MODEL,
                max_tokens=512,
                system=system,
                messages=[{"role": "user", "content": user_prompt}],
            )
        except anthropic.APIError as exc:
            raise ExplorerLlmError(f"Anthropic API error: {exc.message}") from exc
        except Exception as exc:
            raise ExplorerLlmError(f"Anthropic API error: {exc}") from exc

    async def run(self, question: str, database_url: str | None = None) -> dict:
        self._ensure_demo_db()
        db_path = self._db_path(database_url)
        workflow_id = str(uuid.uuid4())
        t0 = datetime.utcnow()

        # Step 1: schema introspection
        t_schema = datetime.utcnow()
        try:
            schema = self._introspect(db_path)
        except sqlite3.Error as exc:
            raise ExplorerSqlError(f"Could not read demo database: {exc}") from exc
        schema_ms = int((datetime.utcnow() - t_schema).total_seconds() * 1000)

        trace = await self._save_trace(workflow_id, question)
        trace_id = trace.id if trace else None
        await self._save_span(trace_id, "schema-introspection", "retrieval", question, schema, schema_ms)

        # Step 2: SQL generation
        t_gen = datetime.utcnow()
        prompt = f"Schema:\n{schema}\n\nQuestion: {question}"
        resp = self._call_llm(SQL_SYSTEM, prompt)
        sql = self._clean_sql(response_text(resp))
        if not sql:
            raise ExplorerLlmError("Anthropic returned an empty SQL response.")
        gen_ms = int((datetime.utcnow() - t_gen).total_seconds() * 1000)
        in_tok = resp.usage.input_tokens
        out_tok = resp.usage.output_tokens
        cost = (in_tok * 0.00025 + out_tok * 0.00125) / 1000
        await self._save_span(
            trace_id, "sql-generation", "llm", prompt, sql, gen_ms, MODEL, in_tok, out_tok, cost
        )

        # Step 3: execute (with retry)
        t_exec = datetime.utcnow()
        try:
            rows, cols = self._execute(db_path, sql)
        except Exception as first_error:
            fix_prompt = f"SQL: {sql}\nError: {first_error}\nSchema: {schema}"
            fix_resp = self._call_llm(FIX_SYSTEM, fix_prompt)
            sql = self._clean_sql(response_text(fix_resp))
            fix_ms = int((datetime.utcnow() - t_exec).total_seconds() * 1000)
            await self._save_span(trace_id, "sql-retry", "llm", fix_prompt, sql, fix_ms, MODEL)
            try:
                rows, cols = self._execute(db_path, sql)
            except Exception as second_error:
                raise ExplorerSqlError(
                    f"Could not execute generated SQL. Last error: {second_error}"
                ) from second_error

        total_ms = int((datetime.utcnow() - t0).total_seconds() * 1000)

        db = self.db
        if trace is not None and db is not None:
            try:
                trace.output = sql
                trace.ended_at = datetime.utcnow()
                trace.total_latency = total_ms
                trace.total_cost = cost
                await db.commit()
            except Exception:
                await db.rollback()

        return {
            "traceId": str(trace_id or workflow_id),
            "sql": sql,
            "rows": rows,
            "columns": cols,
            "latencyMs": total_ms,
            "costUsd": float(cost),
        }

    async def get_schema(self) -> dict:
        if not DEMO_DB.exists():
            from data.seed_demo import seed_sqlite
            seed_sqlite()
        conn = sqlite3.connect(str(DEMO_DB))
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables_info = []
        for (t,) in cur.fetchall():
            cur.execute(f"PRAGMA table_info({t})")
            cols = [{"name": c[1], "type": c[2]} for c in cur.fetchall()]
            cur.execute(f"SELECT COUNT(*) FROM {t}")
            row_count = cur.fetchone()[0]
            tables_info.append({"name": t, "columns": cols, "rowCount": row_count})
        conn.close()
        return {"tables": tables_info}

    async def get_preview(self, table_name: str, limit: int = 1000) -> dict:
        """Return up to `limit` rows from a table. Table name is validated against sqlite_master."""
        conn = sqlite3.connect(str(DEMO_DB))
        cur = conn.cursor()
        # Validate table name — never trust user input in SQL
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cur.fetchone():
            conn.close()
            return {"table": table_name, "columns": [], "rows": [], "count": 0}
        cur.execute(f'SELECT * FROM "{table_name}" LIMIT ?', (limit,))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return {"table": table_name, "columns": cols, "rows": rows, "count": len(rows)}

    async def get_history(self) -> dict:
        if self.db is None:
            return {"items": []}
        try:
            from sqlalchemy import select
            from app.models.trace import Trace
            q = select(Trace).where(Trace.name == "nl2sql-query").order_by(Trace.started_at.desc()).limit(10)
            rows = (await self.db.execute(q)).scalars().all()
            return {"items": [{"question": r.input, "sql": r.output, "created_at": str(r.started_at)} for r in rows]}
        except Exception:
            return {"items": []}
