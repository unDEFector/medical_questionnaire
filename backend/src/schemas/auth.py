from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    public_id: str = Field(min_length=3, max_length=20)
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    public_id: str
    role: str
    patient_id: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserRead


class PatientCredentials(BaseModel):
    public_id: str
    password: str
