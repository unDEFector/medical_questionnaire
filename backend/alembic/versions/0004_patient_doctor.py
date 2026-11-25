"""Assign patients to their doctors.

Revision ID: 0004_patient_doctor
Revises: 0003_admin_role
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_patient_doctor"
down_revision: str | None = "0003_admin_role"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("patients", sa.Column("doctor_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_patients_doctor_id_users",
        "patients",
        "users",
        ["doctor_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_patients_doctor_id"), "patients", ["doctor_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_patients_doctor_id"), table_name="patients")
    op.drop_constraint("fk_patients_doctor_id_users", "patients", type_="foreignkey")
    op.drop_column("patients", "doctor_id")
