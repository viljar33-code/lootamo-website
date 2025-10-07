"""Add product sync logs table

Revision ID: add_product_sync_logs
Revises: add_product_tracking_fields
Create Date: 2025-01-17 16:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_product_sync_logs'
down_revision = 'add_product_tracking_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Create product_sync_logs table
    op.create_table('product_sync_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('total_synced', sa.Integer(), nullable=False),
        sa.Column('new_products', sa.Integer(), nullable=False),
        sa.Column('updated_products', sa.Integer(), nullable=False),
        sa.Column('inactive_products', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index(op.f('ix_product_sync_logs_run_at'), 'product_sync_logs', ['run_at'], unique=False)
    op.create_index(op.f('ix_product_sync_logs_status'), 'product_sync_logs', ['status'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_product_sync_logs_status'), table_name='product_sync_logs')
    op.drop_index(op.f('ix_product_sync_logs_run_at'), table_name='product_sync_logs')
    
    # Drop table
    op.drop_table('product_sync_logs')
