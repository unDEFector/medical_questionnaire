from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.cache.client import get_cached, set_cached
from src.db.session import get_session
from src.schemas.dashboard import DashboardRead
from src.services.dashboard import get_dashboard as build_dashboard

router = APIRouter(tags=["Обзор"])


@router.get("/dashboard", response_model=DashboardRead)
async def read_dashboard(session: AsyncSession = Depends(get_session)) -> DashboardRead:
    cached = await get_cached("dashboard")
    if cached:
        return DashboardRead.model_validate_json(cached)
    dashboard = await build_dashboard(session)
    await set_cached("dashboard", dashboard.model_dump_json())
    return dashboard
