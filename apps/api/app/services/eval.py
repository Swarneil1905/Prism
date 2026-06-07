import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.trace import Trace
from app.models.eval import Eval
import anthropic
from app.core.config import settings
from app.utils.anthropic import response_text

JUDGE_MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "You are a precise SQL output evaluator. Given a natural language question, "
    "generated SQL, and the query result, determine if the SQL correctly answers "
    'the question. Return JSON only: {"verdict": "pass" or "fail", "score": 0.0-1.0, "reasoning": "one sentence"}.'
)


async def run_eval(trace_id: uuid.UUID, db: AsyncSession) -> dict:
    q = select(Trace).where(Trace.id == trace_id).options(selectinload(Trace.spans))
    trace = (await db.execute(q)).scalar_one_or_none()
    if not trace:
        return {"error": "trace not found"}

    result_preview = (trace.output or "")[:500]
    sql_span = next((s for s in trace.spans if s.span_type == "llm"), None)
    sql_snippet = sql_span.response if sql_span else ""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    user_msg = f"Question: {trace.input}\n\nGenerated SQL: {sql_snippet}\n\nResult: {result_preview}\n\nEvaluate."

    try:
        resp = client.messages.create(
            model=JUDGE_MODEL,
            max_tokens=256,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        data = json.loads(response_text(resp))
        verdict = data.get("verdict", "fail")
        score = float(data.get("score", 0.0))
        reasoning = data.get("reasoning", "")
    except Exception:
        verdict, score, reasoning = "fail", 0.0, "Parse error"

    ev = Eval(
        trace_id=trace_id,
        verdict=verdict,
        score=score,
        reasoning=reasoning,
        eval_type="auto",
        judge_model=JUDGE_MODEL,
    )
    db.add(ev)
    await db.commit()
    await db.refresh(ev)
    return {"id": str(ev.id), "verdict": verdict, "score": score}
