import json
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

from app.core.db_url import normalize_database_url


def parse_cors_origins(value: str) -> List[str]:
    stripped = value.strip()
    if not stripped:
        return ["http://localhost:3000"]
    if stripped.startswith("["):
        return json.loads(stripped)
    if "," in stripped:
        return [origin.strip() for origin in stripped.split(",") if origin.strip()]
    return [stripped]


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/prism"
    secret_key: str = "dev-secret"
    algorithm: str = "HS256"
    access_token_expire_days: int = 30
    anthropic_api_key: str = ""
    cors_origins_raw: str = Field(
        default="http://localhost:3000",
        validation_alias="CORS_ORIGINS",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        return normalize_database_url(value) if value else value

    @property
    def cors_origins(self) -> List[str]:
        return parse_cors_origins(self.cors_origins_raw)

    class Config:
        env_file = ".env"


settings = Settings()
