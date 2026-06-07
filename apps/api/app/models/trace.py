from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Numeric, Integer, TIMESTAMP, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from datetime import datetime

if TYPE_CHECKING:
    from app.models.eval import Eval
    from app.models.span import Span


class Trace(Base):
    __tablename__ = "traces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(Text)
    input: Mapped[str | None] = mapped_column(Text)
    output: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, nullable=False, default="ok")
    started_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    ended_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    total_cost: Mapped[float | None] = mapped_column(Numeric(10, 6))
    total_latency: Mapped[int | None] = mapped_column(Integer)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON)

    spans: Mapped[list["Span"]] = relationship("Span", back_populates="trace", cascade="all, delete-orphan")
    evals: Mapped[list["Eval"]] = relationship("Eval", back_populates="trace", cascade="all, delete-orphan")
