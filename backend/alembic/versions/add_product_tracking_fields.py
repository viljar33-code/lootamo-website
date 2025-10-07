"""Add product tracking fields

Revision ID: add_product_tracking_fields
Revises: add_product_active_tracking
Create Date: 2025-01-17 16:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_product_tracking_fields'
down_revision = 'add_product_active_tracking'
branch_labels = None
depends_on = None


def upgrade():
    # Check if columns already exist before adding them
    conn = op.get_bind()
    
    # Check if is_active column exists
    result = conn.execute(sa.text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
    """))
    
    if not result.fetchone():
        # Add is_active column
        op.add_column('products', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
        op.create_index(op.f('ix_products_is_active'), 'products', ['is_active'], unique=False)
    
    # Check if last_synced column exists
    result = conn.execute(sa.text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'last_synced'
    """))
    
    if not result.fetchone():
        # Add last_synced column
        op.add_column('products', sa.Column('last_synced', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    # Drop the columns and index if they exist
    conn = op.get_bind()
    
    # Check and drop index
    result = conn.execute(sa.text("""
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'products' AND indexname = 'ix_products_is_active'
    """))
    
    if result.fetchone():
        op.drop_index(op.f('ix_products_is_active'), table_name='products')
    
    # Check and drop columns
    result = conn.execute(sa.text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
    """))
    
    if result.fetchone():
        op.drop_column('products', 'is_active')
    
    result = conn.execute(sa.text("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'last_synced'
    """))
    
    if result.fetchone():
        op.drop_column('products', 'last_synced')
