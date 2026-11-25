import pytest
from src.config import BaseConfig


def test_nested_environment_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP__NAME", "Тестовое приложение")
    monkeypatch.setenv("APP__FRONTEND_URL", "https://medical.example.test")
    monkeypatch.setenv("APP__SEED_DEMO_DATA", "true")
    monkeypatch.setenv("AUTH__ADMIN_ID", "A-TEST01")
    monkeypatch.setenv("AUTH__ADMIN_PASSWORD", "admin-test-password")
    monkeypatch.setenv("AUTH__BOOTSTRAP_DOCTOR_ENABLED", "false")
    monkeypatch.setenv("DATABASE__USER_NAME", "user")
    monkeypatch.setenv("DATABASE__PASSWORD", "p@ss/word")
    monkeypatch.setenv("DATABASE__HOST", "db")
    monkeypatch.setenv("DATABASE__PORT", "5433")
    monkeypatch.setenv("DATABASE__DB_NAME", "medical")
    monkeypatch.setenv("REDIS__HOST", "cache")
    monkeypatch.setenv("REDIS__PORT", "6380")
    monkeypatch.setenv("REDIS__DB", "2")
    monkeypatch.setenv("UNRELATED_SETTING", "ignored")

    settings = BaseConfig(_env_file=None)

    assert settings.app.name == "Тестовое приложение"
    assert settings.app.frontend_url == "https://medical.example.test"
    assert settings.app.seed_demo_data is True
    assert settings.auth.admin_id == "A-TEST01"
    assert settings.auth.admin_password == "admin-test-password"
    assert settings.auth.bootstrap_doctor_enabled is False
    assert settings.database.url == "postgresql+asyncpg://user:p%40ss%2Fword@db:5433/medical"
    assert settings.redis.url == "redis://cache:6380/2"
