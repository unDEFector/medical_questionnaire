from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.dashboard import router as dashboard_router
from src.api.patients import router as patients_router
from src.api.surveys import router as surveys_router
from src.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
    if settings.seed_demo_data:
        from src.db.seed import seed_demo_data

        await seed_demo_data()
    yield


app = FastAPI(
    title=settings.app_name,
    description="API медицинского опроса и мониторинга нутритивного риска",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(surveys_router, prefix="/api/v1")


@app.get("/health", tags=["Система"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
