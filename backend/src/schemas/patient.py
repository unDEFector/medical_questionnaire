import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    birth_date: date
    gender: str = Field(pattern="^(female|male|other)$")
    diagnosis: str = Field(min_length=2, max_length=300)
    therapy: str = Field(default="", max_length=300)
    height_cm: float = Field(gt=50, le=250)
    initial_weight_kg: float = Field(gt=20, le=500)


class SurveyAnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_key: str
    value: int


class SurveyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    status: str
    token: str
    risk_level: str | None
    risk_score: int | None
    weight_kg: float | None
    weight_change_percent: float
    wellbeing_note: str
    due_date: datetime | None
    created_at: datetime
    completed_at: datetime | None
    answers: list[SurveyAnswerRead] = Field(default_factory=list)


class TrendPoint(BaseModel):
    survey_id: uuid.UUID
    date: datetime
    kind: str
    risk_score: int
    weight_kg: float
    weight_change_percent: float
    symptom_scores: dict[str, int]


class PatientListItem(BaseModel):
    id: uuid.UUID
    full_name: str
    age: int
    gender: str
    diagnosis: str
    therapy: str
    created_at: datetime
    survey_count: int
    latest_risk: str | None
    latest_survey_at: datetime | None
    next_survey_at: datetime | None


class PatientDetail(BaseModel):
    id: uuid.UUID
    full_name: str
    age: int
    birth_date: date
    gender: str
    diagnosis: str
    therapy: str
    height_cm: float
    initial_weight_kg: float
    created_at: datetime
    surveys: list[SurveyRead]
    trends: list[TrendPoint]
    current_risk: str | None
    current_recommendations: list[str]


class PatientCreated(BaseModel):
    patient: PatientDetail
    survey_url: str
