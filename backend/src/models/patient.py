import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from src.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(160))
    birth_date: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(20))
    diagnosis: Mapped[str] = mapped_column(String(300))
    therapy: Mapped[str] = mapped_column(String(300), default="")
    height_cm: Mapped[float]
    initial_weight_kg: Mapped[float]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    surveys: Mapped[list["Survey"]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="Survey.created_at",
    )

    @property
    def age(self) -> int:
        today = date.today()
        return (
            today.year
            - self.birth_date.year
            - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        )


from src.models.survey import Survey  # noqa: E402
