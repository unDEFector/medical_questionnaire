import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuestionOption(BaseModel):
    value: int
    label: str


class SurveyQuestion(BaseModel):
    key: str
    section: str
    title: str
    kind: str
    options: list[QuestionOption]
    detail_label: str | None = None
    respondent: str
    required: bool


class SurveyAnswerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_key: str
    value: int | None
    text_value: str


class SurveyDetail(BaseModel):
    id: uuid.UUID
    patient_public_id: str
    kind: str
    status: str
    due_date: datetime | None
    baseline_weight_kg: float
    questions: list[SurveyQuestion]
    answers: list[SurveyAnswerRead]
    red_flags: list[str]


class SurveySubmit(BaseModel):
    answers: dict[str, int | str]
    details: dict[str, str] = Field(default_factory=dict)
    current_weight_kg: float | None = Field(default=None, gt=20, le=500)
    wellbeing_note: str = Field(default="", max_length=2000)


class ClinicalAnswersUpdate(BaseModel):
    answers: dict[str, int | str]
    details: dict[str, str] = Field(default_factory=dict)


class SurveySubmitted(BaseModel):
    survey_id: uuid.UUID
    status: str
    completed_at: datetime
    red_flags: list[str]
