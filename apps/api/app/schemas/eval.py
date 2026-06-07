from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class EvalOut(BaseModel):
    id: uuid.UUID
    traceId: uuid.UUID = Field(validation_alias="trace_id")
    verdict: str
    score: Optional[float] = None
    reasoning: Optional[str] = None
    evalType: str = Field(validation_alias="eval_type")
    judgeModel: Optional[str] = Field(None, validation_alias="judge_model")
    createdAt: datetime = Field(validation_alias="created_at")
    humanOverride: Optional[str] = Field(None, validation_alias="human_override")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class EvalListResponse(BaseModel):
    items: List[EvalOut]
    total: int


class EvalStats(BaseModel):
    pass_rate_7d: List[float]
    overall_pass_rate: float
    avg_score: float
    pending_human_review: int


class EvalOverride(BaseModel):
    verdict: str
