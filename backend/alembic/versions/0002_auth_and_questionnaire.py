"""Add authenticated roles and questionnaire answers.

Revision ID: 0002_auth_and_questionnaire
Revises: 0001_initial
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_auth_and_questionnaire"
down_revision: str | None = "0001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

user_role = sa.Enum("doctor", "patient", name="userrole")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("public_id", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_public_id"), "users", ["public_id"], unique=True)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(op.f("ix_auth_sessions_user_id"), "auth_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_auth_sessions_expires_at"), "auth_sessions", ["expires_at"], unique=False)
    op.add_column("patients", sa.Column("user_id", sa.Uuid(), nullable=True))
    op.add_column(
        "patients", sa.Column("medication", sa.String(length=120), server_default="", nullable=False)
    )
    op.add_column("patients", sa.Column("first_dose_date", sa.Date(), nullable=True))
    op.add_column("patients", sa.Column("starting_dose", sa.Float(), nullable=True))
    op.execute("""
        INSERT INTO users (id, public_id, password_hash, role, created_at)
        SELECT gen_random_uuid(), 'P-' || upper(substr(replace(id::text, '-', ''), 1, 12)),
               '!disabled', 'patient', now() FROM patients
        """)
    op.execute("""
        UPDATE patients SET user_id = users.id FROM users
        WHERE users.public_id = 'P-' || upper(substr(replace(patients.id::text, '-', ''), 1, 12))
        """)
    op.alter_column("patients", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_patients_user_id_users", "patients", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_unique_constraint("uq_patients_user_id", "patients", ["user_id"])
    for column in ("full_name", "birth_date", "gender", "diagnosis", "therapy"):
        op.drop_column("patients", column)
    op.add_column("survey_answers", sa.Column("text_value", sa.Text(), server_default="", nullable=False))
    op.alter_column("survey_answers", "value", nullable=True)
    op.drop_column("surveys", "token")
    op.drop_column("surveys", "risk_level")
    op.drop_column("surveys", "risk_score")
    bind = op.get_bind()
    sa.Enum(name="risklevel").drop(bind, checkfirst=True)


def downgrade() -> None:
    op.add_column("surveys", sa.Column("risk_score", sa.Integer(), nullable=True))
    op.add_column(
        "surveys",
        sa.Column("risk_level", sa.Enum("low", "moderate", "high", name="risklevel"), nullable=True),
    )
    op.add_column("surveys", sa.Column("token", sa.String(length=64), nullable=True))
    op.execute("UPDATE surveys SET token = replace(id::text, '-', '')")
    op.alter_column("surveys", "token", nullable=False)
    op.create_unique_constraint("uq_surveys_token", "surveys", ["token"])
    op.alter_column("survey_answers", "value", nullable=True)
    op.execute("DELETE FROM survey_answers WHERE value IS NULL")
    op.alter_column("survey_answers", "value", nullable=False)
    op.drop_column("survey_answers", "text_value")
    op.add_column("patients", sa.Column("therapy", sa.String(length=300), server_default="", nullable=False))
    op.add_column(
        "patients", sa.Column("diagnosis", sa.String(length=300), server_default="", nullable=False)
    )
    op.add_column(
        "patients", sa.Column("gender", sa.String(length=20), server_default="other", nullable=False)
    )
    op.add_column("patients", sa.Column("birth_date", sa.Date(), server_default="1970-01-01", nullable=False))
    op.add_column(
        "patients", sa.Column("full_name", sa.String(length=160), server_default="", nullable=False)
    )
    op.drop_constraint("uq_patients_user_id", "patients", type_="unique")
    op.drop_constraint("fk_patients_user_id_users", "patients", type_="foreignkey")
    for column in ("user_id", "starting_dose", "first_dose_date", "medication"):
        op.drop_column("patients", column)
    op.drop_index(op.f("ix_auth_sessions_expires_at"), table_name="auth_sessions")
    op.drop_index(op.f("ix_auth_sessions_user_id"), table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_public_id"), table_name="users")
    op.drop_table("users")
    user_role.drop(op.get_bind(), checkfirst=True)
