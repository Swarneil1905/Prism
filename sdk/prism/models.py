from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class Span:
    trace_id: str
    name: str
    span_type: str = "llm"
    model: Optional[str] = None
    prompt: Optional[str] = None
    response: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    cost_usd: Optional[float] = None
    latency_ms: Optional[int] = None
    started_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None


@dataclass
class Workflow:
    workflow_id: str
    name: str
    input: Optional[str] = None
    output: Optional[str] = None
    trace_id: Optional[str] = None

    def set_output(self, output: str):
        self.output = output
