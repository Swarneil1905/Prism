from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class SpanCreate(BaseModel):
    trace_id: uuid.UUID
    name: str
    model: Optional[str] = None
    prompt: Optional[str] = None
    response: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    cost_usd: Optional[float] = None
    latency_ms: Optional[int] = None
    started_at: Optional[datetime] = None
    span_type: str = "llm"
    metadata: Optional[dict] = None
