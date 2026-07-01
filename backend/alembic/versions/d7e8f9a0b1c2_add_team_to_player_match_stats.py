"""add team to player_match_stats

Revision ID: d7e8f9a0b1c2
Revises: 8b89a054bcbe
Create Date: 2026-07-01 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd7e8f9a0b1c2'
down_revision: Union[str, None] = '8b89a054bcbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Nullable — partidas existentes ficam com team=NULL (sem separação de times)
    op.add_column('player_match_stats', sa.Column('team', sa.String(1), nullable=True))


def downgrade() -> None:
    op.drop_column('player_match_stats', 'team')
