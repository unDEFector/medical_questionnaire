import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.patient import Patient
from src.models.survey import Survey
from src.models.user import User, UserRole
from src.schemas.admin import AdminStats, AdminUserRead, DoctorCreate
from src.services.auth import create_user
from src.services.dashboard import get_dashboard


def admin_user_read(user: User) -> AdminUserRead:
    return AdminUserRead(
        id=user.id,
        public_id=user.public_id,
        role=user.role.value,
        created_at=user.created_at,
        patient_id=user.patient.id if user.role == UserRole.patient and user.patient else None,
    )


async def list_users(session: AsyncSession, role: UserRole) -> list[User]:
    result = await session.scalars(
        select(User)
        .where(User.role == role)
        .options(selectinload(User.patient))
        .order_by(User.created_at.desc())
    )
    return list(result)


async def get_stats(session: AsyncSession) -> AdminStats:
    role_counts = dict(
        (await session.execute(select(User.role, func.count(User.id)).group_by(User.role))).all()
    )
    dashboard = await get_dashboard(session)
    return AdminStats(
        admin_count=role_counts.get(UserRole.admin, 0),
        doctor_count=role_counts.get(UserRole.doctor, 0),
        patient_count=dashboard.patient_count,
        attention_count=dashboard.attention_count,
        pending_count=dashboard.pending_count,
        completed_count=dashboard.completed_count,
    )


async def create_doctor(session: AsyncSession, data: DoctorCreate) -> User:
    public_id = data.public_id.strip().upper()
    if await session.scalar(select(User.id).where(User.public_id == public_id)) is not None:
        raise ValueError("Пользователь с таким ID уже существует")
    return await create_user(session, public_id, data.password, UserRole.doctor)


async def delete_user(session: AsyncSession, user_id: uuid.UUID) -> bool:
    user = await session.scalar(
        select(User)
        .where(User.id == user_id, User.role.in_([UserRole.doctor, UserRole.patient]))
        .options(
            selectinload(User.auth_sessions),
            selectinload(User.patient).selectinload(Patient.surveys).selectinload(Survey.answers),
        )
    )
    if user is None:
        raise LookupError("Врач или пациент не найден")
    is_patient = user.role == UserRole.patient
    await session.delete(user)
    await session.flush()
    return is_patient
