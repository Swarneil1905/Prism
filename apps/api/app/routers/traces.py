from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.trace import Trace
from app.schemas.trace import TraceOut, TraceCreate, TracePatch, TraceListResponse
from typing import Optional
import uuid
from datetime import datetime

router = APIRouter()


@router.get("", response_model=TraceListResponse)
async def list_traces(
    page: int = 1,
    limit: int = Query(50, le=100),
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Trace).order_by(Trace.started_at.desc())
    if start:
        q = q.where(Trace.started_at >= start)
    if end:
        q = q.where(Trace.started_at <= end)
    if status:
        q = q.where(Trace.status == status)
    if search:
        q = q.where(Trace.input.ilike(f"%{search}%"))

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar_one()

    q = q.offset((page - 1) * limit).limit(limit).options(selectinload(Trace.spans))
    rows = (await db.execute(q)).scalars().all()
    return TraceListResponse(
        items=[TraceOut.model_validate(r) for r in rows],
        total=total,
        page=page,
    )


@router.get("/{trace_id}", response_model=TraceOut)
async def get_trace(trace_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    q = select(Trace).where(Trace.id == trace_id).options(selectinload(Trace.spans))
    result = (await db.execute(q)).scalar_one_or_none()
    return result


@router.post("", status_code=201)
async def create_trace(body: TraceCreate, db: AsyncSession = Depends(get_db)):
    trace = Trace(
        workflow_id=body.workflow_id,
        name=body.name,
        input=body.input,
        started_at=body.started_at or datetime.utcnow(),
        metadata_=body.metadata,
    )
    db.add(trace)
    await db.commit()
    await db.refresh(trace)
    return {"id": str(trace.id)}


@router.patch("/{trace_id}")
async def patch_trace(trace_id: uuid.UUID, body: TracePatch, db: AsyncSession = Depends(get_db)):
    q = select(Trace).where(Trace.id == trace_id)
    trace = (await db.execute(q)).scalar_one()
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(trace, field, val)
    await db.commit()
    return {"id": str(trace.id)}
