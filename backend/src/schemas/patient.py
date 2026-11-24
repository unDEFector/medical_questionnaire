import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field
from src.schemas.auth import PatientCredentials
from src.schemas.survey import SurveyAnswerRead


class PatientCreate(BaseModel):
    height_cm: float = Field(gt=50, le=250)
    initial_weight_kg: float = Field(gt=20, le=500)
    medication: str = Field(min_length=2, max_length=120)
    first_dose_date: date | None = None
    starting_dose: float | None = Field(default=None, gt=0, le=1000)


class SurveyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    status: str
    weight_kg: float | None
    weight_change_percent: float
    wellbeing_note: str
    due_date: datetime | None
    created_at: datetime
    completed_at: datetime | None
    answers: list[SurveyAnswerRead] = Field(default_factory=list)
    red_flags: list[str]


class TrendPoint(BaseModel):
    survey_id: uuid.UUID
    date: datetime
    kind: str
    weight_kg: float
    weight_change_percent: float


class PatientListItem(BaseModel):
    id: uuid.UUID
    public_id: str
    medication: str
    created_at: datetime
    survey_count: int
    latest_attention: bool | None
    latest_survey_at: datetime | None
    next_survey_at: datetime | None


class PatientDetail(BaseModel):
    id: uuid.UUID
    public_id: str
    height_cm: float
    initial_weight_kg: float
    bmi: float
    medication: str
    first_dose_date: date | None
    starting_dose: float | None
    created_at: datetime
    surveys: list[SurveyRead]
    trends: list[TrendPoint]
    current_red_flags: list[str]


class PatientCreated(BaseModel):
    patient: PatientDetail
    credentials: PatientCredentials
