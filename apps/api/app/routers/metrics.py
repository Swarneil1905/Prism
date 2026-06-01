from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.trace import Trace
from app.models.eval import Eval
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/overview")
async def overview(db: AsyncSession = Depends(get_db)):
    total = (await db.execute(select(func.count(Trace.id)))).scalar_one()
    avg_cost = (await db.execute(select(func.avg(Trace.total_cost)))).scalar_one() or 0.0
    avg_latency = (await db.execute(select(func.avg(Trace.total_latency)))).scalar_one() or 0
    pass_count = (await db.execute(select(func.count(Eval.id)).where(Eval.verdict == "pass"))).scalar_one()
    eval_total = (await db.execute(select(func.count(Eval.id)))).scalar_one()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    traces_today = (await db.execute(select(func.count(Trace.id)).where(Trace.started_at >= today_start))).scalar_one()

    return {
        "total_traces": total,
        "avg_cost": float(avg_cost),
        "avg_latency_ms": int(avg_latency),
        "pass_rate": round(pass_count / eval_total, 3) if eval_total else 0.0,
        "traces_today": traces_today,
    }
