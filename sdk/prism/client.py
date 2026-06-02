"""HTTP client that posts traces and spans to the Prism API."""
import httpx
import sys
from typing import Optional


class PrismClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def _post(self, path: str, payload: dict) -> Optional[dict]:
        try:
            r = httpx.post(f"{self.base_url}{path}", json=payload, headers=self.headers, timeout=5)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[prism] warning: {e}", file=sys.stderr)
            return None

    def _patch(self, path: str, payload: dict) -> Optional[dict]:
        try:
            r = httpx.patch(f"{self.base_url}{path}", json=payload, headers=self.headers, timeout=5)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[prism] warning: {e}", file=sys.stderr)
            return None

    def create_trace(self, workflow_id: str, name: Optional[str] = None, input: Optional[str] = None, metadata: Optional[dict] = None) -> Optional[str]:
        data = {"workflow_id": workflow_id, "name": name, "input": input, "metadata": metadata}
        resp = self._post("/api/v1/traces", {k: v for k, v in data.items() if v is not None})
        return resp["id"] if resp else None

    def patch_trace(self, trace_id: str, output: Optional[str] = None, status: str = "ok", total_cost: Optional[float] = None, total_latency: Optional[int] = None):
        payload = {"status": status}
        if output is not None:
            payload["output"] = output
        if total_cost is not None:
            payload["total_cost"] = total_cost
        if total_latency is not None:
            payload["total_latency"] = total_latency
        self._patch(f"/api/v1/traces/{trace_id}", payload)

    def create_span(self, **kwargs) -> Optional[str]:
        resp = self._post("/api/v1/spans", {k: v for k, v in kwargs.items() if v is not None})
        return resp["id"] if resp else None
