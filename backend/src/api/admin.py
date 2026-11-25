import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.dependencies import AdminUser
from src.cache.client import invalidate_dashboard
from src.db.session import get_session
from src.models.user import UserRole
from src.schemas.admin import AdminStats, AdminUserRead, DoctorCreate
from src.schemas.patient import PatientCreate, PatientCreated
from src.services import admin, patients

router = APIRouter(prefix="/admin", tags=["Администрирование"])


@router.get("/stats", response_model=AdminStats)
async def read_stats(_: AdminUser, session: AsyncSession = Depends(get_session)) -> AdminStats:
    return await admin.get_stats(session)


@router.get("/doctors", response_model=list[AdminUserRead])
async def read_doctors(_: AdminUser, session: AsyncSession = Depends(get_session)) -> list[AdminUserRead]:
    users = await admin.list_users(session, UserRole.doctor)
    return [admin.admin_user_read(user) for user in users]


@router.post("/doctors", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
async def add_doctor(
    data: DoctorCreate,
    _: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> AdminUserRead:
    try:
        doctor = await admin.create_doctor(session, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    await session.commit()
    return admin.admin_user_read(doctor)


@router.get("/patients", response_model=list[AdminUserRead])
async def read_patients(_: AdminUser, session: AsyncSession = Depends(get_session)) -> list[AdminUserRead]:
    users = await admin.list_users(session, UserRole.patient)
    return [admin.admin_user_read(user) for user in users]


@router.post("/patients", response_model=PatientCreated, status_code=status.HTTP_201_CREATED)
async def add_patient(
    data: PatientCreate,
    _: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> PatientCreated:
    patient, credentials = await patients.create_patient(session, data)
    await session.commit()
    await invalidate_dashboard()
    detail = await patients.get_patient(session, patient.id)
    return PatientCreated(patient=patients.patient_detail(detail), credentials=credentials)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(
    user_id: uuid.UUID,
    _: AdminUser,
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        is_patient = await admin.delete_user(session, user_id)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    await session.commit()
    if is_patient:
        await invalidate_dashboard()
