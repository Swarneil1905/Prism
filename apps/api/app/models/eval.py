from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from datetime import datetime

if TYPE_CHECKING:
    from app.models.trace import Trace


class Eval(Base):
    __tablename__ = "evals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("traces.id", ondelete="CASCADE"), nullable=False, index=True)
    verdict: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[float | None] = mapped_column(Numeric(4, 3))
    reasoning: Mapped[str | None] = mapped_column(Text)
    eval_type: Mapped[str] = mapped_column(String, nullable=False, default="auto")
    judge_model: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    human_override: Mapped[str | None] = mapped_column(String)

    trace: Mapped["Trace"] = relationship("Trace", back_populates="evals")
