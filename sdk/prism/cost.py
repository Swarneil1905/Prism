"""Token cost lookup table per model (USD per 1K tokens)."""

COSTS: dict[str, dict[str, float]] = {
    "claude-haiku-4-5-20251001": {"input": 0.00025, "output": 0.00125},
    "claude-sonnet-4-6":         {"input": 0.003,   "output": 0.015},
    "claude-opus-4-6":           {"input": 0.015,   "output": 0.075},
    "gpt-4o":                    {"input": 0.005,   "output": 0.015},
    "gpt-4o-mini":               {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo":             {"input": 0.0005,  "output": 0.0015},
    "gemini-1.5-flash":          {"input": 0.000075,"output": 0.0003},
    "gemini-1.5-pro":            {"input": 0.00125, "output": 0.005},
}


def compute_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    entry = COSTS.get(model, {"input": 0.0, "output": 0.0})
    return (input_tokens * entry["input"] + output_tokens * entry["output"]) / 1000
