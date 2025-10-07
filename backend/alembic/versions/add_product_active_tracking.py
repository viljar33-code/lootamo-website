"""Add is_active and last_synced fields to products

Revision ID: add_product_active_tracking
Revises: 
Create Date: 2025-01-17 15:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_product_active_tracking'
down_revision = '76d0cf7551cb'  # Add product models
branch_labels = None
depends_on = None


def upgrade():
    # Add is_active column with default True and index
    op.add_column('products', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.create_index(op.f('ix_products_is_active'), 'products', ['is_active'], unique=False)
    
    # Add last_synced column with current timestamp as default
    op.add_column('products', sa.Column('last_synced', sa.DateTime(timezone=True), 
                                       nullable=True, server_default=sa.text('now()')))


def downgrade():
    # Remove the columns and index
    op.drop_index(op.f('ix_products_is_active'), table_name='products')
    op.drop_column('products', 'last_synced')
    op.drop_column('products', 'is_active')
