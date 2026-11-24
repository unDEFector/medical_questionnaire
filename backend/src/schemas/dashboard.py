from pydantic import BaseModel
from src.schemas.patient import PatientListItem


class DashboardRead(BaseModel):
    patient_count: int
    high_risk_count: int
    pending_count: int
    completed_count: int
    recent_patients: list[PatientListItem]
