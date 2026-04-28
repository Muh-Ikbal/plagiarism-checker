"""add dictionary

Revision ID: 1518f8a101b0
Revises: fc72a68f5cc3
Create Date: 2026-04-22 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1518f8a101b0'
down_revision: Union[str, None] = 'fc72a68f5cc3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('dictionaries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('file_path', sa.String(), nullable=False),
    sa.Column('file_size_mb', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dictionaries_id'), 'dictionaries', ['id'], unique=False)
    op.create_index(op.f('ix_dictionaries_name'), 'dictionaries', ['name'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_dictionaries_name'), table_name='dictionaries')
    op.drop_index(op.f('ix_dictionaries_id'), table_name='dictionaries')
    op.drop_table('dictionaries')
