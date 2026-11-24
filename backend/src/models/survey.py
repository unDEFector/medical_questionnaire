import enum
import secrets
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from src.db.base import Base


class SurveyKind(enum.StrEnum):
    baseline = "baseline"
    followup = "followup"


class SurveyStatus(enum.StrEnum):
    pending = "pending"
    completed = "completed"


class RiskLevel(enum.StrEnum):
    low = "low"
    moderate = "moderate"
    high = "high"


class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    kind: Mapped[SurveyKind] = mapped_column(default=SurveyKind.baseline)
    status: Mapped[SurveyStatus] = mapped_column(default=SurveyStatus.pending, index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, default=lambda: secrets.token_urlsafe(24))
    risk_level: Mapped[RiskLevel | None] = mapped_column(default=None)
    risk_score: Mapped[int | None] = mapped_column(default=None)
    weight_kg: Mapped[float | None] = mapped_column(default=None)
    weight_change_percent: Mapped[float] = mapped_column(default=0)
    wellbeing_note: Mapped[str] = mapped_column(Text, default="")
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    patient: Mapped["Patient"] = relationship(back_populates="surveys")
    answers: Mapped[list["SurveyAnswer"]] = relationship(
        back_populates="survey",
        cascade="all, delete-orphan",
    )


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"
    __table_args__ = (UniqueConstraint("survey_id", "question_key", name="uq_survey_question"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    survey_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("surveys.id", ondelete="CASCADE"))
    question_key: Mapped[str] = mapped_column(String(40))
    value: Mapped[int] = mapped_column(Integer)

    survey: Mapped[Survey] = relationship(back_populates="answers")


from src.models.patient import Patient  # noqa: E402
