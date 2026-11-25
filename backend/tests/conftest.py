import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from src.db.base import Base
from src.db.session import get_session
from src.main import app
from src.models import Patient, Survey, SurveyAnswer, User  # noqa: F401
from src.models.user import UserRole
from src.services.auth import create_user


@pytest_asyncio.fixture
async def session_factory():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield factory
    await engine.dispose()


@pytest_asyncio.fixture
async def client(session_factory):
    async def override_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def doctor_credentials(session_factory):
    credentials = {"public_id": "D-TEST01", "password": "doctor-test-password"}
    async with session_factory() as session:
        await create_user(session, credentials["public_id"], credentials["password"], UserRole.doctor)
        await session.commit()
    return credentials


@pytest_asyncio.fixture
async def doctor_headers(client: AsyncClient, doctor_credentials: dict[str, str]):
    response = await client.post("/api/v1/auth/login", json=doctor_credentials)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest_asyncio.fixture
async def second_doctor_credentials(session_factory):
    credentials = {"public_id": "D-TEST02", "password": "second-doctor-test-password"}
    async with session_factory() as session:
        await create_user(session, credentials["public_id"], credentials["password"], UserRole.doctor)
        await session.commit()
    return credentials


@pytest_asyncio.fixture
async def second_doctor_headers(client: AsyncClient, second_doctor_credentials: dict[str, str]):
    response = await client.post("/api/v1/auth/login", json=second_doctor_credentials)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest_asyncio.fixture
async def admin_credentials(session_factory):
    credentials = {"public_id": "A-TEST01", "password": "admin-test-password"}
    async with session_factory() as session:
        await create_user(session, credentials["public_id"], credentials["password"], UserRole.admin)
        await session.commit()
    return credentials


@pytest_asyncio.fixture
async def admin_headers(client: AsyncClient, admin_credentials: dict[str, str]):
    response = await client.post("/api/v1/auth/login", json=admin_credentials)
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
