from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class SpanOut(BaseModel):
    id: uuid.UUID
    trace_id: uuid.UUID
    name: str
    model: Optional[str] = None
    prompt: Optional[str] = None
    response: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    cost_usd: Optional[float] = None
    latency_ms: Optional[int] = None
    started_at: datetime
    span_type: str

    model_config = {"from_attributes": True}


class TraceOut(BaseModel):
    id: uuid.UUID
    workflow_id: str
    name: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    status: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_cost: Optional[float] = None
    total_latency: Optional[int] = None
    spans: Optional[List[SpanOut]] = None

    model_config = {"from_attributes": True}


class TraceCreate(BaseModel):
    workflow_id: str
    name: Optional[str] = None
    input: Optional[str] = None
    started_at: Optional[datetime] = None
    metadata: Optional[dict] = None


class TracePatch(BaseModel):
    output: Optional[str] = None
    ended_at: Optional[datetime] = None
    status: Optional[str] = None
    total_cost: Optional[float] = None
    total_latency: Optional[int] = None


class TraceListResponse(BaseModel):
    items: List[TraceOut]
    total: int
    page: int
