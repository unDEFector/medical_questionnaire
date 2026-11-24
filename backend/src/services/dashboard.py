from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.survey import RiskLevel, Survey, SurveyStatus
from src.schemas.dashboard import DashboardRead
from src.schemas.patient import PatientListItem
from src.services.patients import list_patients, patient_list_item


async def get_dashboard(session: AsyncSession) -> DashboardRead:
    patients = await list_patients(session)
    items: list[PatientListItem] = [patient_list_item(patient) for patient in patients]
    high_risk = sum(item.latest_risk == RiskLevel.high.value for item in items)
    pending = await session.scalar(select(func.count(Survey.id)).where(Survey.status == SurveyStatus.pending))
    completed = await session.scalar(
        select(func.count(Survey.id)).where(Survey.status == SurveyStatus.completed)
    )
    return DashboardRead(
        patient_count=len(patients),
        high_risk_count=high_risk,
        pending_count=pending or 0,
        completed_count=completed or 0,
        recent_patients=items[:5],
    )
