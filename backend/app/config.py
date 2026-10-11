"""Application settings (env-driven)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CRIMEMAP API"
    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/crimemap"
    )
    # Default analysis range mirrors the React app's DEMO_DATE_RANGE.
    default_range_from: str = "2026-04-01"
    default_range_to: str = "2026-10-08"

    model_config = SettingsConfigDict(
        env_prefix="CRIMEMAP_",
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
