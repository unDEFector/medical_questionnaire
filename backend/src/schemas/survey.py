import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator
from src.schemas.risk import RiskResult


class QuestionOption(BaseModel):
    value: int
    label: str


class SurveyQuestion(BaseModel):
    key: str
    title: str
    description: str
    options: list[QuestionOption]


class PublicSurvey(BaseModel):
    id: uuid.UUID
    patient_name: str
    kind: str
    status: str
    due_date: datetime | None
    baseline_weight_kg: float
    questions: list[SurveyQuestion]
    result: RiskResult | None = None


class SurveySubmit(BaseModel):
    answers: dict[str, int]
    current_weight_kg: float | None = Field(default=None, gt=20, le=500)
    wellbeing_note: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def validate_answers(self) -> "SurveySubmit":
        from src.services.risk import QUESTIONS

        expected = {question.key for question in QUESTIONS}
        if set(self.answers) != expected:
            raise ValueError("Ответьте на все вопросы анкеты")
        ranges = {question.key: {option.value for option in question.options} for question in QUESTIONS}
        if any(value not in ranges[key] for key, value in self.answers.items()):
            raise ValueError("Выбран недопустимый вариант ответа")
        return self


class SurveySubmitted(BaseModel):
    survey_id: uuid.UUID
    status: str
    completed_at: datetime
    result: RiskResult
