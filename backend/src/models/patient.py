import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from src.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    height_cm: Mapped[float]
    initial_weight_kg: Mapped[float]
    medication: Mapped[str] = mapped_column(String(120), default="")
    first_dose_date: Mapped[date | None] = mapped_column(Date, default=None)
    starting_dose: Mapped[float | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="patient")
    surveys: Mapped[list["Survey"]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="Survey.created_at",
    )

    @property
    def public_id(self) -> str:
        return self.user.public_id


from src.models.survey import Survey  # noqa: E402
from src.models.user import User  # noqa: E402
