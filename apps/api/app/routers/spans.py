from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.span import Span
from app.schemas.span import SpanCreate
from datetime import datetime

router = APIRouter()


@router.post("", status_code=201)
async def create_span(body: SpanCreate, db: AsyncSession = Depends(get_db)):
    span = Span(
        trace_id=body.trace_id,
        name=body.name,
        model=body.model,
        prompt=body.prompt,
        response=body.response,
        input_tokens=body.input_tokens,
        output_tokens=body.output_tokens,
        cost_usd=body.cost_usd,
        latency_ms=body.latency_ms,
        started_at=body.started_at or datetime.utcnow(),
        span_type=body.span_type,
        metadata_=body.metadata,
    )
    db.add(span)
    await db.commit()
    await db.refresh(span)
    return {"id": str(span.id)}
