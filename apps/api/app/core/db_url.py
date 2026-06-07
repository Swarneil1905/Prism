import os


def normalize_database_url(url: str) -> str:
    """Convert Railway/Heroku postgres URLs to SQLAlchemy asyncpg format."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def resolve_database_url() -> str:
    raw = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_PRIVATE_URL", "")
    if raw:
        return normalize_database_url(raw)
    return "postgresql+asyncpg://postgres:postgres@localhost:5432/prism"
