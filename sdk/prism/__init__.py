"""Prism SDK — wrap LLM calls and record traces."""
from .decorator import trace, workflow
from .client import PrismClient
from . import decorator as _dec

_client_instance = None


def configure(base_url: str, api_key: str):
    global _client_instance
    _client_instance = PrismClient(base_url=base_url, api_key=api_key)
    _dec._client = _client_instance


__all__ = ["trace", "workflow", "configure", "PrismClient"]
