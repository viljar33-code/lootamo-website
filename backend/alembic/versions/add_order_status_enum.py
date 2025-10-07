"""Add order status enum and update existing orders

Revision ID: add_order_status_enum
Revises: 
Create Date: 2025-10-02 12:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_order_status_enum'
down_revision = None  # Update this with the latest revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the new order status enum
    order_status_enum = postgresql.ENUM(
        'pending', 'paid', 'complete', 'cancelled', 'expired',
        name='orderstatus'
    )
    order_status_enum.create(op.get_bind())
    
    # No need to alter the status column as it's already a string
    # The enum is used in the model for validation, not as a database constraint
    
    # Update any existing orders with invalid statuses to 'pending'
    op.execute("""
        UPDATE orders 
        SET status = 'pending' 
        WHERE status NOT IN ('pending', 'paid', 'complete', 'cancelled', 'expired')
    """)


def downgrade() -> None:
    # Drop the enum type
    op.execute("DROP TYPE IF EXISTS orderstatus")
