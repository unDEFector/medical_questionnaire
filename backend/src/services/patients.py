import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.patient import Patient
from src.models.survey import Survey, SurveyKind, SurveyStatus
from src.models.user import AuthSession, User, UserRole
from src.schemas.auth import PatientCredentials
from src.schemas.patient import PatientCreate, PatientDetail, PatientListItem, SurveyRead, TrendPoint
from src.services.auth import create_user, hash_password, user_public_id


def patient_list_item(patient: Patient) -> PatientListItem:
    completed = [survey for survey in patient.surveys if survey.status == SurveyStatus.completed]
    pending = [survey for survey in patient.surveys if survey.status == SurveyStatus.pending]
    latest = completed[-1] if completed else None
    next_survey = min(pending, key=lambda survey: survey.due_date or survey.created_at, default=None)
    return PatientListItem(
        id=patient.id,
        public_id=patient.public_id,
        medication=patient.medication,
        created_at=patient.created_at,
        survey_count=len(completed),
        latest_attention=bool(latest.red_flags) if latest else None,
        latest_survey_at=latest.completed_at if latest else None,
        next_survey_at=next_survey.due_date if next_survey else None,
    )


def patient_detail(patient: Patient) -> PatientDetail:
    completed = [survey for survey in patient.surveys if survey.status == SurveyStatus.completed]
    latest = completed[-1] if completed else None
    trends = [
        TrendPoint(
            survey_id=survey.id,
            date=survey.completed_at or survey.created_at,
            kind=survey.kind.value,
            weight_kg=survey.weight_kg or patient.initial_weight_kg,
            weight_change_percent=survey.weight_change_percent,
        )
        for survey in completed
    ]
    return PatientDetail(
        id=patient.id,
        public_id=patient.public_id,
        height_cm=patient.height_cm,
        initial_weight_kg=patient.initial_weight_kg,
        bmi=round(patient.initial_weight_kg / (patient.height_cm / 100) ** 2, 1),
        medication=patient.medication,
        first_dose_date=patient.first_dose_date,
        starting_dose=patient.starting_dose,
        created_at=patient.created_at,
        surveys=[SurveyRead.model_validate(survey) for survey in reversed(patient.surveys)],
        trends=trends,
        current_red_flags=latest.red_flags if latest else [],
    )


async def list_patients(
    session: AsyncSession, search: str | None = None, doctor_id: uuid.UUID | None = None
) -> list[Patient]:
    query = (
        select(Patient)
        .join(Patient.user)
        .options(selectinload(Patient.user), selectinload(Patient.surveys).selectinload(Survey.answers))
        .order_by(Patient.created_at.desc())
    )
    if doctor_id is not None:
        query = query.where(Patient.doctor_id == doctor_id)
    if search:
        query = query.where(User.public_id.ilike(f"%{search.strip()}%"))
    result = await session.scalars(query)
    return list(result)


async def get_patient(
    session: AsyncSession, patient_id: uuid.UUID, doctor_id: uuid.UUID | None = None
) -> Patient:
    query = (
        select(Patient)
        .where(Patient.id == patient_id)
        .options(selectinload(Patient.user), selectinload(Patient.surveys).selectinload(Survey.answers))
    )
    if doctor_id is not None:
        query = query.where(Patient.doctor_id == doctor_id)
    result = await session.scalar(query)
    if result is None:
        raise LookupError("Пациент не найден")
    return result


async def new_patient_public_id(session: AsyncSession) -> str:
    for _ in range(20):
        public_id = user_public_id("P")
        if await session.scalar(select(User.id).where(User.public_id == public_id)) is None:
            return public_id
    raise RuntimeError("Не удалось выделить ID пациента")


async def create_patient(
    session: AsyncSession, data: PatientCreate, doctor: User | None = None
) -> tuple[Patient, PatientCredentials]:
    password = secrets.token_urlsafe(9)
    public_id = await new_patient_public_id(session)
    user = await create_user(session, public_id, password, UserRole.patient)
    patient = Patient(
        user_id=user.id,
        doctor_id=doctor.id if doctor is not None else None,
        **data.model_dump(),
    )
    patient.surveys.append(Survey(kind=SurveyKind.baseline, due_date=datetime.now(UTC)))
    session.add(patient)
    await session.flush()
    return await get_patient(session, patient.id), PatientCredentials(public_id=public_id, password=password)


async def reset_patient_password(session: AsyncSession, patient: Patient) -> PatientCredentials:
    password = secrets.token_urlsafe(9)
    patient.user.password_hash = hash_password(password)
    await session.execute(delete(AuthSession).where(AuthSession.user_id == patient.user_id))
    await session.flush()
    return PatientCredentials(public_id=patient.public_id, password=password)


async def create_followup(session: AsyncSession, patient: Patient) -> Survey:
    pending = next((survey for survey in patient.surveys if survey.status == SurveyStatus.pending), None)
    if pending:
        return pending
    survey = Survey(patient=patient, kind=SurveyKind.followup, due_date=datetime.now(UTC))
    session.add(survey)
    await session.flush()
    return survey


def next_followup_date(completed_at: datetime) -> datetime:
    return completed_at + timedelta(days=90)
