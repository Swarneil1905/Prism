"""@trace decorator and workflow context manager."""
import asyncio
import functools
import time
import uuid
from contextvars import ContextVar
from typing import Optional
from datetime import datetime


_active_workflow_id: ContextVar[Optional[str]] = ContextVar("_active_workflow_id", default=None)
_active_trace_id: ContextVar[Optional[str]] = ContextVar("_active_trace_id", default=None)
_client = None


def _get_client():
    return _client


def trace(name: str, workflow_id: Optional[str] = None, span_type: str = "llm", model: Optional[str] = None):
    """Decorator that records a span for every call to the wrapped function."""
    def decorator(fn):
        @functools.wraps(fn)
        async def async_wrapper(*args, **kwargs):
            client = _get_client()
            wf_id = workflow_id or _active_workflow_id.get() or str(uuid.uuid4())
            trace_id = _active_trace_id.get()

            if client and not trace_id:
                trace_id = client.create_trace(workflow_id=wf_id, name=name)

            t0 = time.monotonic()
            try:
                result = await fn(*args, **kwargs)
                status = "ok"
            except Exception:
                status = "error"
                raise
            finally:
                latency_ms = int((time.monotonic() - t0) * 1000)
                if client and trace_id:
                    prompt = str(args[0]) if args else None
                    response = str(result) if status == "ok" else None
                    client.create_span(
                        trace_id=trace_id,
                        name=name,
                        span_type=span_type,
                        model=model,
                        prompt=prompt,
                        response=response,
                        latency_ms=latency_ms,
                        started_at=datetime.utcnow().isoformat(),
                    )
            return result

        @functools.wraps(fn)
        def sync_wrapper(*args, **kwargs):
            client = _get_client()
            wf_id = workflow_id or _active_workflow_id.get() or str(uuid.uuid4())
            trace_id = _active_trace_id.get()

            if client and not trace_id:
                trace_id = client.create_trace(workflow_id=wf_id, name=name)

            t0 = time.monotonic()
            try:
                result = fn(*args, **kwargs)
                return result
            finally:
                latency_ms = int((time.monotonic() - t0) * 1000)
                if client and trace_id:
                    client.create_span(
                        trace_id=trace_id,
                        name=name,
                        span_type=span_type,
                        model=model,
                        latency_ms=latency_ms,
                        started_at=datetime.utcnow().isoformat(),
                    )

        return async_wrapper if asyncio.iscoroutinefunction(fn) else sync_wrapper
    return decorator


class workflow:
    """Async context manager that creates a trace and links all child spans."""
    def __init__(self, name: str, input: Optional[str] = None):
        self.name = name
        self.input = input
        self._wf_id = str(uuid.uuid4())
        self._trace_id: Optional[str] = None
        self._output: Optional[str] = None
        self._t0 = None

    def set_output(self, output):
        self._output = str(output)

    async def __aenter__(self):
        client = _get_client()
        self._t0 = time.monotonic()
        if client:
            self._trace_id = client.create_trace(workflow_id=self._wf_id, name=self.name, input=self.input)
        _active_workflow_id.set(self._wf_id)
        _active_trace_id.set(self._trace_id)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        client = _get_client()
        if client and self._trace_id:
            latency_ms = int((time.monotonic() - self._t0) * 1000)
            client.patch_trace(
                self._trace_id,
                output=self._output,
                status="error" if exc_type else "ok",
                total_latency=latency_ms,
            )
        _active_workflow_id.set(None)
        _active_trace_id.set(None)
