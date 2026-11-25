import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DoctorCreate(BaseModel):
    public_id: str = Field(min_length=3, max_length=20, pattern=r"^[Dd]-[A-Za-z0-9-]+$")
    password: str = Field(min_length=12, max_length=128)


class AdminUserRead(BaseModel):
    id: uuid.UUID
    public_id: str
    role: str
    created_at: datetime
    patient_id: uuid.UUID | None = None


class AdminStats(BaseModel):
    admin_count: int
    doctor_count: int
    patient_count: int
    attention_count: int
    pending_count: int
    completed_count: int
