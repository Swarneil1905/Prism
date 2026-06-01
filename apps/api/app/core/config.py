from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/prism"
    secret_key: str = "dev-secret"
    algorithm: str = "HS256"
    access_token_expire_days: int = 30
    anthropic_api_key: str = ""
    cors_origins: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

    def model_post_init(self, __context):
        # Allow CORS_ORIGINS as JSON string
        pass


settings = Settings()
