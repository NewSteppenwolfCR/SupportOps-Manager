"""initial existing schema

Revision ID: 390a6c69a16e
Revises:
Create Date: 2026-08-14 23:08:53.465998

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "390a6c69a16e"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = None

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

    # =====================================================
    # AGENTS
    # =====================================================

    op.create_table(
        "agents",

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
            "schedule",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "email"
        ),
    )


    op.create_index(
        op.f("ix_agents_id"),
        "agents",
        ["id"],
        unique=False,
    )


    op.create_index(
        op.f("ix_agents_email"),
        "agents",
        ["email"],
        unique=True,
    )


    # =====================================================
    # OVERTIME REQUESTS
    # =====================================================

    op.create_table(
        "overtime_requests",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "agent_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "date",
            sa.Date(),
            nullable=False,
        ),

        sa.Column(
            "start_time",
            sa.Time(),
            nullable=False,
        ),

        sa.Column(
            "end_time",
            sa.Time(),
            nullable=False,
        ),

        sa.Column(
            "total_hours",
            sa.Numeric(
                precision=5,
                scale=2,
            ),
            nullable=False,
        ),

        sa.Column(
            "justification",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "admin_comment",
            sa.String(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["agents.id"],
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),
    )


    op.create_index(
        op.f(
            "ix_overtime_requests_id"
        ),
        "overtime_requests",
        ["id"],
        unique=False,
    )


    op.create_index(
        op.f(
            "ix_overtime_requests_agent_id"
        ),
        "overtime_requests",
        ["agent_id"],
        unique=False,
    )


def downgrade() -> None:

    op.drop_index(
        op.f(
            "ix_overtime_requests_agent_id"
        ),
        table_name="overtime_requests",
    )

    op.drop_index(
        op.f(
            "ix_overtime_requests_id"
        ),
        table_name="overtime_requests",
    )

    op.drop_table(
        "overtime_requests"
    )


    op.drop_index(
        op.f("ix_agents_email"),
        table_name="agents",
    )

    op.drop_index(
        op.f("ix_agents_id"),
        table_name="agents",
    )

    op.drop_table(
        "agents"
    )