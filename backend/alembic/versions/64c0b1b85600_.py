"""empty message

Revision ID: 64c0b1b85600
Revises: add_email_queue_001, ae0d6fbcfa4c
Create Date: 2025-09-30 16:23:05.061090

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '64c0b1b85600'
down_revision = ('add_email_queue_001', 'ae0d6fbcfa4c')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
