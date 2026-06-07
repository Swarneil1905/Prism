from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class SpanOut(BaseModel):
    id: uuid.UUID
    traceId: uuid.UUID = Field(validation_alias="trace_id")
    name: str
    model: Optional[str] = None
    prompt: Optional[str] = None
    response: Optional[str] = None
    inputTokens: Optional[int] = Field(None, validation_alias="input_tokens")
    outputTokens: Optional[int] = Field(None, validation_alias="output_tokens")
    costUsd: Optional[float] = Field(None, validation_alias="cost_usd")
    latencyMs: Optional[int] = Field(None, validation_alias="latency_ms")
    startedAt: datetime = Field(validation_alias="started_at")
    spanType: str = Field(validation_alias="span_type")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class TraceOut(BaseModel):
    id: uuid.UUID
    workflowId: str = Field(validation_alias="workflow_id")
    name: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    status: str
    startedAt: datetime = Field(validation_alias="started_at")
    endedAt: Optional[datetime] = Field(None, validation_alias="ended_at")
    totalCost: Optional[float] = Field(None, validation_alias="total_cost")
    totalLatency: Optional[int] = Field(None, validation_alias="total_latency")
    spans: Optional[List[SpanOut]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


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
