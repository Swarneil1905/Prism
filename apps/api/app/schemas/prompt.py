from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class PromptVersionOut(BaseModel):
    id: uuid.UUID
    name: str
    version: int
    content: str
    created_at: datetime
    stats: Optional[dict] = None

    model_config = {"from_attributes": True}


class PromptVersionCreate(BaseModel):
    content: str


class PromptSummary(BaseModel):
    name: str
    version_count: int
