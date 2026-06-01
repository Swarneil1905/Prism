from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class EvalOut(BaseModel):
    id: uuid.UUID
    trace_id: uuid.UUID
    verdict: str
    score: Optional[float] = None
    reasoning: Optional[str] = None
    eval_type: str
    judge_model: Optional[str] = None
    created_at: datetime
    human_override: Optional[str] = None

    model_config = {"from_attributes": True}


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
