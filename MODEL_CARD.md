# Model Card — Prism NL2SQL + Eval Judge

## Models Used

### NL2SQL — `claude-haiku-4-5-20251001`
- **Purpose**: Converts natural language questions to SQL queries for the SQL Explorer
- **Input**: User question + SQLite schema context
- **Output**: Raw SQL query
- **Max tokens**: 512 (output)
- **Temperature**: 0 (deterministic)
- **Retry logic**: Up to 2 retries on SQL syntax error

### Eval Judge — `claude-haiku-4-5-20251001`
- **Purpose**: Scores LLM trace quality from 0.0–1.0 and returns pass/fail verdict
- **Input**: Trace input + output (truncated to 500 chars each)
- **Output**: JSON `{ verdict, score, reasoning }`
- **Verdict threshold**: score ≥ 0.7 → pass
- **Human override**: Always takes precedence over auto verdict

## Cost Estimates

| Model | Input (per 1M tok) | Output (per 1M tok) |
|-------|-------------------|---------------------|
| claude-haiku-4-5-20251001 | $0.80 | $4.00 |

A typical NL2SQL query costs **~$0.0001–0.0005** depending on schema complexity.
A typical eval run costs **~$0.0001–0.0003**.

## Limitations

- SQL Explorer only supports SQLite (`demo.db` by default). PostgreSQL support planned.
- Eval judge may hallucinate reasoning for ambiguous outputs.
- NL2SQL accuracy degrades on highly nested or multi-join queries.
- No PII scrubbing — do not pass sensitive data through the SDK without redaction.

## Intended Use

Prism is an open-source developer tool for observability of LLM applications. It is not intended for use in high-stakes or regulated domains without additional human review.
