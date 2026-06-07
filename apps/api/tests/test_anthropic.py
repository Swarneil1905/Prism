from types import SimpleNamespace

from anthropic.types import TextBlock

from app.utils.anthropic import response_text


def test_response_text_extracts_text_block():
    resp = SimpleNamespace(content=[TextBlock(type="text", text='{"verdict": "pass"}')])
    assert response_text(resp) == '{"verdict": "pass"}'


def test_response_text_returns_empty_for_non_text_block():
    resp = SimpleNamespace(content=[SimpleNamespace(type="tool_use")])
    assert response_text(resp) == ""
