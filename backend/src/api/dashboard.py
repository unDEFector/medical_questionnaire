from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import DoctorUser
from src.cache.client import get_cached, set_cached
from src.db.session import get_session
from src.schemas.dashboard import DashboardRead
from src.services.dashboard import get_dashboard as build_dashboard

router = APIRouter(tags=["Обзор"])


@router.get("/dashboard", response_model=DashboardRead)
async def read_dashboard(user: DoctorUser, session: AsyncSession = Depends(get_session)) -> DashboardRead:
    cache_key = f"dashboard:v3:{user.id}"
    cached = await get_cached(cache_key)
    if cached:
        return DashboardRead.model_validate_json(cached)
    dashboard = await build_dashboard(session, doctor_id=user.id)
    await set_cached(cache_key, dashboard.model_dump_json())
    return dashboard
