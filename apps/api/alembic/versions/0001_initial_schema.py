"""initial schema

Revision ID: 0001
Revises:
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "traces",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workflow_id", sa.Text, nullable=False),
        sa.Column("name", sa.Text),
        sa.Column("input", sa.Text),
        sa.Column("output", sa.Text),
        sa.Column("status", sa.Text, nullable=False, server_default="ok"),
        sa.Column("started_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("ended_at", sa.TIMESTAMP(timezone=True)),
        sa.Column("total_cost", sa.Numeric(10, 6)),
        sa.Column("total_latency", sa.Integer),
        sa.Column("metadata", JSONB),
    )
    op.create_index("ix_traces_workflow_id", "traces", ["workflow_id"])
    op.create_index("ix_traces_started_at", "traces", ["started_at"])

    op.create_table(
        "spans",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("trace_id", UUID(as_uuid=True), sa.ForeignKey("traces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("model", sa.Text),
        sa.Column("prompt", sa.Text),
        sa.Column("response", sa.Text),
        sa.Column("input_tokens", sa.Integer),
        sa.Column("output_tokens", sa.Integer),
        sa.Column("cost_usd", sa.Numeric(10, 6)),
        sa.Column("latency_ms", sa.Integer),
        sa.Column("started_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("span_type", sa.Text, nullable=False, server_default="llm"),
        sa.Column("metadata", JSONB),
    )
    op.create_index("ix_spans_trace_id", "spans", ["trace_id"])

    op.create_table(
        "evals",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("trace_id", UUID(as_uuid=True), sa.ForeignKey("traces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("verdict", sa.Text, nullable=False),
        sa.Column("score", sa.Numeric(4, 3)),
        sa.Column("reasoning", sa.Text),
        sa.Column("eval_type", sa.Text, nullable=False, server_default="auto"),
        sa.Column("judge_model", sa.Text),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("human_override", sa.Text),
    )
    op.create_index("ix_evals_trace_id", "evals", ["trace_id"])
    op.create_index("ix_evals_created_at", "evals", ["created_at"])

    op.create_table(
        "prompt_versions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("version", sa.Integer, nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("name", "version"),
    )

    op.create_table(
        "prompt_version_stats",
        sa.Column("prompt_version_id", UUID(as_uuid=True), sa.ForeignKey("prompt_versions.id"), primary_key=True),
        sa.Column("trace_count", sa.Integer, server_default="0"),
        sa.Column("pass_count", sa.Integer, server_default="0"),
        sa.Column("fail_count", sa.Integer, server_default="0"),
        sa.Column("avg_cost", sa.Numeric(10, 6)),
        sa.Column("avg_latency_ms", sa.Integer),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("prompt_version_stats")
    op.drop_table("prompt_versions")
    op.drop_table("evals")
    op.drop_table("spans")
    op.drop_table("traces")
