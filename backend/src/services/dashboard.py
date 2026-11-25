import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.patient import Patient
from src.models.survey import Survey, SurveyStatus
from src.schemas.dashboard import DashboardRead
from src.schemas.patient import PatientListItem
from src.services.patients import list_patients, patient_list_item


async def get_dashboard(session: AsyncSession, doctor_id: uuid.UUID | None = None) -> DashboardRead:
    patients = await list_patients(session, doctor_id=doctor_id)
    items: list[PatientListItem] = [patient_list_item(patient) for patient in patients]
    attention = sum(item.latest_attention is True for item in items)
    pending_query = (
        select(func.count(Survey.id)).join(Survey.patient).where(Survey.status == SurveyStatus.pending)
    )
    completed_query = (
        select(func.count(Survey.id)).join(Survey.patient).where(Survey.status == SurveyStatus.completed)
    )
    if doctor_id is not None:
        pending_query = pending_query.where(Patient.doctor_id == doctor_id)
        completed_query = completed_query.where(Patient.doctor_id == doctor_id)
    pending = await session.scalar(pending_query)
    completed = await session.scalar(completed_query)
    return DashboardRead(
        patient_count=len(patients),
        attention_count=attention,
        pending_count=pending or 0,
        completed_count=completed or 0,
        recent_patients=items[:5],
    )
