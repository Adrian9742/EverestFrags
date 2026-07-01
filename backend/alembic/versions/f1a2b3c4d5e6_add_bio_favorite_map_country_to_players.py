"""add bio favorite_map country to players

Revision ID: f1a2b3c4d5e6
Revises: d7e8f9a0b1c2
Create Date: 2026-07-01
"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = 'd7e8f9a0b1c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('players', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('players', sa.Column('favorite_map', sa.String(50), nullable=True))
    op.add_column('players', sa.Column('country', sa.String(5), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'country')
    op.drop_column('players', 'favorite_map')
    op.drop_column('players', 'bio')
