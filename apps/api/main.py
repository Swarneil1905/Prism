from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import traces, spans, evals, prompts, explorer, metrics, auth

app = FastAPI(title="Prism API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(traces.router, prefix="/api/v1/traces", tags=["traces"])
app.include_router(spans.router, prefix="/api/v1/spans", tags=["spans"])
app.include_router(evals.router, prefix="/api/v1/evals", tags=["evals"])
app.include_router(prompts.router, prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(explorer.router, prefix="/api/v1/explorer", tags=["explorer"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])


@app.get("/health")
async def health():
    return {"status": "ok"}
