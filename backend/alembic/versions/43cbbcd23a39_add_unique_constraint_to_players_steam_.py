"""add unique constraint to players.steam_id

Revision ID: 43cbbcd23a39
Revises: 0f4cb0768353
Create Date: 2026-06-28 23:14:27.472255

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '43cbbcd23a39'
down_revision: Union[str, None] = '0f4cb0768353'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint('uq_players_steam_id', 'players', ['steam_id'])


def downgrade() -> None:
    op.drop_constraint('uq_players_steam_id', 'players', type_='unique')
