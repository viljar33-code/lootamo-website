"""merge_heads_for_system_monitoring

Revision ID: 9b6080e5164f
Revises: 3bce3915ce70, 56fd955add34, add_order_status_enum
Create Date: 2025-10-09 10:37:44.328861

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9b6080e5164f'
down_revision = ('3bce3915ce70', '56fd955add34', 'add_order_status_enum')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
