"""create admins table

Revision ID: 342ebdf855e5
Revises: af7b83b902a1
Create Date: 2026-08-15 00:33:25.388012
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "342ebdf855e5"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "af7b83b902a1"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "first_name",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "last_name",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "password_hash",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_index(
        op.f("ix_admins_id"),
        "admins",
        ["id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_admins_email"),
        "admins",
        ["email"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_admins_email"),
        table_name="admins",
    )

    op.drop_index(
        op.f("ix_admins_id"),
        table_name="admins",
    )

    op.drop_table("admins")