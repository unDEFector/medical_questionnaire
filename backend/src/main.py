from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.admin import router as admin_router
from src.api.auth import router as auth_router
from src.api.dashboard import router as dashboard_router
from src.api.patients import router as patients_router
from src.api.surveys import router as surveys_router
from src.config import config
from src.db.session import SessionFactory
from src.services.auth import ensure_bootstrap_admin, ensure_bootstrap_doctor


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
    async with SessionFactory() as session:
        await ensure_bootstrap_admin(session)
        await ensure_bootstrap_doctor(session)
        await session.commit()
    if config.app.seed_demo_data:
        from src.db.seed import seed_demo_data

        await seed_demo_data()
    yield


app = FastAPI(
    title=config.app.name,
    description="API медицинского опроса с ролями администратора, врача и пациента",
    version="0.3.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.app.frontend_url, "http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(surveys_router, prefix="/api/v1")


@app.get("/health", tags=["Система"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
