"""Create patients, surveys and answers.

Revision ID: 0001_initial
Revises:
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

survey_kind = sa.Enum("baseline", "followup", name="surveykind")
survey_status = sa.Enum("pending", "completed", name="surveystatus")
risk_level = sa.Enum("low", "moderate", "high", name="risklevel")


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(length=20), nullable=False),
        sa.Column("diagnosis", sa.String(length=300), nullable=False),
        sa.Column("therapy", sa.String(length=300), nullable=False),
        sa.Column("height_cm", sa.Float(), nullable=False),
        sa.Column("initial_weight_kg", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "surveys",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("patient_id", sa.Uuid(), nullable=False),
        sa.Column("kind", survey_kind, nullable=False),
        sa.Column("status", survey_status, nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("risk_level", risk_level, nullable=True),
        sa.Column("risk_score", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("weight_change_percent", sa.Float(), nullable=False),
        sa.Column("wellbeing_note", sa.Text(), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index(op.f("ix_surveys_status"), "surveys", ["status"], unique=False)
    op.create_table(
        "survey_answers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("survey_id", sa.Uuid(), nullable=False),
        sa.Column("question_key", sa.String(length=40), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["survey_id"], ["surveys.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("survey_id", "question_key", name="uq_survey_question"),
    )


def downgrade() -> None:
    op.drop_table("survey_answers")
    op.drop_index(op.f("ix_surveys_status"), table_name="surveys")
    op.drop_table("surveys")
    op.drop_table("patients")
    bind = op.get_bind()
    risk_level.drop(bind, checkfirst=True)
    survey_status.drop(bind, checkfirst=True)
    survey_kind.drop(bind, checkfirst=True)
