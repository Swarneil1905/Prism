from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid


class PromptVersionOut(BaseModel):
    id: uuid.UUID
    name: str
    version: int
    content: str
    createdAt: datetime = Field(validation_alias="created_at")
    stats: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PromptVersionCreate(BaseModel):
    content: str


class PromptSummary(BaseModel):
    name: str
    version_count: int
