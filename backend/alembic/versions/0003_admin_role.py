"""Add administrator role.

Revision ID: 0003_admin_role
Revises: 0002_auth_and_questionnaire
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0003_admin_role"
down_revision: str | None = "0002_auth_and_questionnaire"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'admin'")


def downgrade() -> None:
    pass
