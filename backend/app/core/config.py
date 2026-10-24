from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.schemas import TimeZoneName


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    secret_key: str = Field(min_length=32)
    access_token_expire_minutes: int = Field(60 * 12, ge=1)
    cors_origins: list[str] = ["http://localhost:5173"]
    default_timezone: TimeZoneName = "UTC"

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.default_timezone)


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
