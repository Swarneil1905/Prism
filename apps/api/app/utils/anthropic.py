from anthropic.types import TextBlock


def response_text(resp) -> str:
    block = resp.content[0]
    if isinstance(block, TextBlock):
        return block.text
    return ""
