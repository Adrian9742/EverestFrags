"""add team scores to matches

Revision ID: a1b2c3d4e5f6
Revises: d7e8f9a0b1c2
Create Date: 2026-07-02 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'd7e8f9a0b1c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Placar de rounds — ex: 13-8. Nullable para partidas anteriores ao parse do demo.
    op.add_column('matches', sa.Column('team_a_score', sa.Integer(), nullable=True))
    op.add_column('matches', sa.Column('team_b_score', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('matches', 'team_b_score')
    op.drop_column('matches', 'team_a_score')
