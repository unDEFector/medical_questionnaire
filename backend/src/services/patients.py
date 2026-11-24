import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.models.patient import Patient
from src.models.survey import Survey, SurveyKind, SurveyStatus
from src.schemas.patient import PatientCreate, PatientDetail, PatientListItem, SurveyRead, TrendPoint
from src.services.risk import calculate_risk


def patient_list_item(patient: Patient) -> PatientListItem:
    completed = [survey for survey in patient.surveys if survey.status == SurveyStatus.completed]
    pending = [survey for survey in patient.surveys if survey.status == SurveyStatus.pending]
    latest = completed[-1] if completed else None
    next_survey = min(pending, key=lambda survey: survey.due_date or survey.created_at, default=None)
    return PatientListItem(
        id=patient.id,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        diagnosis=patient.diagnosis,
        therapy=patient.therapy,
        created_at=patient.created_at,
        survey_count=len(completed),
        latest_risk=latest.risk_level.value if latest and latest.risk_level else None,
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
            risk_score=survey.risk_score or 0,
            weight_kg=survey.weight_kg or patient.initial_weight_kg,
            weight_change_percent=survey.weight_change_percent,
            symptom_scores={answer.question_key: answer.value for answer in survey.answers},
        )
        for survey in completed
    ]
    recommendations: list[str] = []
    if latest:
        answers = {answer.question_key: answer.value for answer in latest.answers}
        recommendations = calculate_risk(
            answers,
            patient.initial_weight_kg,
            latest.weight_kg or patient.initial_weight_kg,
        ).recommendations
    return PatientDetail(
        id=patient.id,
        full_name=patient.full_name,
        age=patient.age,
        birth_date=patient.birth_date,
        gender=patient.gender,
        diagnosis=patient.diagnosis,
        therapy=patient.therapy,
        height_cm=patient.height_cm,
        initial_weight_kg=patient.initial_weight_kg,
        created_at=patient.created_at,
        surveys=[SurveyRead.model_validate(survey) for survey in reversed(patient.surveys)],
        trends=trends,
        current_risk=latest.risk_level.value if latest and latest.risk_level else None,
        current_recommendations=recommendations,
    )


async def list_patients(session: AsyncSession, search: str | None = None) -> list[Patient]:
    query = select(Patient).options(selectinload(Patient.surveys)).order_by(Patient.created_at.desc())
    if search:
        query = query.where(Patient.full_name.ilike(f"%{search}%"))
    result = await session.scalars(query)
    return list(result)


async def get_patient(session: AsyncSession, patient_id: uuid.UUID) -> Patient:
    result = await session.scalar(
        select(Patient)
        .where(Patient.id == patient_id)
        .options(selectinload(Patient.surveys).selectinload(Survey.answers))
    )
    if result is None:
        raise LookupError("Пациент не найден")
    return result


async def create_patient(session: AsyncSession, data: PatientCreate) -> Patient:
    patient = Patient(**data.model_dump())
    patient.surveys.append(
        Survey(
            kind=SurveyKind.baseline,
            due_date=datetime.now(UTC),
        )
    )
    session.add(patient)
    await session.flush()
    await session.refresh(patient)
    return await get_patient(session, patient.id)


async def create_followup(session: AsyncSession, patient: Patient) -> Survey:
    pending = next(
        (survey for survey in patient.surveys if survey.status == SurveyStatus.pending),
        None,
    )
    if pending:
        return pending
    survey = Survey(
        patient=patient,
        kind=SurveyKind.followup,
        due_date=datetime.now(UTC),
    )
    session.add(survey)
    await session.flush()
    return survey


def next_followup_date(completed_at: datetime) -> datetime:
    return completed_at + timedelta(days=90)
