import uuid
from sqlalchemy import Text, Numeric, Integer, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from datetime import datetime


class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    __table_args__ = (UniqueConstraint("name", "version"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)

    stats: Mapped["PromptVersionStats | None"] = relationship("PromptVersionStats", back_populates="prompt_version", uselist=False)


class PromptVersionStats(Base):
    __tablename__ = "prompt_version_stats"

    prompt_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"), primary_key=True)
    trace_count: Mapped[int] = mapped_column(Integer, default=0)
    pass_count: Mapped[int] = mapped_column(Integer, default=0)
    fail_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_cost: Mapped[float | None] = mapped_column(Numeric(10, 6))
    avg_latency_ms: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)

    prompt_version: Mapped["PromptVersion"] = relationship("PromptVersion", back_populates="stats")
