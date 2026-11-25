from urllib.parse import quote

from pydantic import BaseModel, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict


class _Section(BaseModel):
    model_config = ConfigDict(extra="ignore")


class AppConfig(_Section):
    name: str = "ИнКлира"
    environment: str = "development"
    frontend_url: str = "http://localhost:3000"
    seed_demo_data: bool = False


class AuthConfig(_Section):
    session_ttl_hours: int = 24
    admin_id: str = "A-000001"
    admin_password: str = "admin-demo-password"
    bootstrap_doctor_enabled: bool = True
    doctor_id: str = "D-000001"
    doctor_password: str = "doctor-demo-password"


class DatabaseConfig(_Section):
    user_name: str = "postgres"
    password: str = "postgres"
    host: str = "127.0.0.1"
    port: int = 5432
    db_name: str = "medical_questionnaire"

    @property
    def url(self) -> str:
        user_name = quote(self.user_name, safe="")
        password = quote(self.password, safe="")
        return f"postgresql+asyncpg://{user_name}:{password}" f"@{self.host}:{self.port}/{self.db_name}"


class RedisConfig(_Section):
    host: str = "127.0.0.1"
    port: int = 6379
    db: int = 0

    @property
    def url(self) -> str:
        return f"redis://{self.host}:{self.port}/{self.db}"


class BaseConfig(BaseSettings):
    app: AppConfig = AppConfig()
    auth: AuthConfig = AuthConfig()
    database: DatabaseConfig = DatabaseConfig()
    redis: RedisConfig = RedisConfig()

    model_config = SettingsConfigDict(
        env_file="backend/.env",
        env_nested_delimiter="__",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


config = BaseConfig()
