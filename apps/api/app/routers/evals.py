from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.eval import Eval
from app.models.trace import Trace
from app.schemas.eval import EvalOut, EvalListResponse, EvalStats, EvalOverride
from app.services.eval import run_eval
from typing import Optional
from datetime import datetime, timedelta
import uuid

router = APIRouter()


@router.get("", response_model=EvalListResponse)
async def list_evals(
    page: int = 1,
    limit: int = Query(50, le=100),
    verdict: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Eval).order_by(Eval.created_at.desc())
    if verdict:
        q = q.where(Eval.verdict == verdict)
    if start:
        q = q.where(Eval.created_at >= start)
    if end:
        q = q.where(Eval.created_at <= end)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    rows = (await db.execute(q.offset((page - 1) * limit).limit(limit))).scalars().all()
    return EvalListResponse(items=rows, total=total)


@router.get("/stats", response_model=EvalStats)
async def eval_stats(db: AsyncSession = Depends(get_db)):
    # 7-day pass rate (simplified)
    pass_rate_7d = []
    for i in range(6, -1, -1):
        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        total = (await db.execute(select(func.count(Eval.id)).where(Eval.created_at >= day_start, Eval.created_at < day_end))).scalar_one()
        passed = (await db.execute(select(func.count(Eval.id)).where(Eval.created_at >= day_start, Eval.created_at < day_end, Eval.verdict == "pass"))).scalar_one()
        pass_rate_7d.append(round(passed / total, 3) if total else 0.0)

    overall_pass = (await db.execute(select(func.count(Eval.id)).where(Eval.verdict == "pass"))).scalar_one()
    overall_total = (await db.execute(select(func.count(Eval.id)))).scalar_one()
    avg_score = (await db.execute(select(func.avg(Eval.score)))).scalar_one() or 0.0
    pending = (await db.execute(select(func.count(Eval.id)).where(Eval.human_override == None, Eval.verdict == "fail"))).scalar_one()

    return EvalStats(
        pass_rate_7d=pass_rate_7d,
        overall_pass_rate=round(overall_pass / overall_total, 3) if overall_total else 0.0,
        avg_score=float(avg_score),
        pending_human_review=pending,
    )


@router.post("/run/{trace_id}", status_code=201)
async def run_eval_endpoint(trace_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await run_eval(trace_id, db)
    return result


@router.patch("/{eval_id}/override")
async def override_eval(eval_id: uuid.UUID, body: EvalOverride, db: AsyncSession = Depends(get_db)):
    ev = (await db.execute(select(Eval).where(Eval.id == eval_id))).scalar_one()
    ev.human_override = body.verdict
    await db.commit()
    return {"id": str(ev.id), "human_override": ev.human_override}
