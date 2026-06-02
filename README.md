# Prism

Open-source, self-hostable LLM observability and NL2SQL platform.

## Quick Start

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Fill in your ANTHROPIC_API_KEY and Google OAuth credentials

docker compose up
```

- Dashboard: http://localhost:3000
- API: http://localhost:8000/docs

## Development

See `apps/api/README.md` and `apps/web/README.md` for per-service setup.

## SDK

```bash
pip install prism-sdk
```

```python
import prism

prism.configure(base_url="http://localhost:8000", api_key="your-key")

@prism.trace(name="my-llm-call", workflow_id="req-123")
async def call_llm(prompt: str) -> str:
    ...
```

## License

MIT
