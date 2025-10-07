"""add_order_items_table_for_multi_item_orders

Revision ID: ae0d6fbcfa4c
Revises: 94e519b51d81
Create Date: 2025-09-29 10:07:16.639753

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ae0d6fbcfa4c'
down_revision = '94e519b51d81'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if total_price column already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('orders')]
    
    # Add new fields to orders table for multi-item support
    if 'total_price' not in columns:
        op.add_column('orders', sa.Column('total_price', sa.Float(), nullable=True))
    
    # Make legacy single-item fields nullable for backward compatibility
    op.alter_column('orders', 'product_id', nullable=True)
    op.alter_column('orders', 'price', nullable=True)
    
    # Check if order_items table already exists
    tables = inspector.get_table_names()
    if 'order_items' not in tables:
        # Create order_items table for multi-item orders
        op.create_table('order_items',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('order_id', sa.Integer(), nullable=False),
            sa.Column('product_id', sa.String(), nullable=False),
            sa.Column('price', sa.Float(), nullable=False),
            sa.Column('quantity', sa.Integer(), nullable=False, default=1),
            sa.Column('g2a_order_id', sa.String(), nullable=True),
            sa.Column('g2a_transaction_id', sa.String(), nullable=True),
            sa.Column('delivered_key', sa.String(), nullable=True),
            sa.Column('status', sa.String(), nullable=False, default='pending'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes for order_items table
        op.create_index('idx_order_item_order_id', 'order_items', ['order_id'])
        op.create_index('idx_order_item_product_id', 'order_items', ['product_id'])
        op.create_index('idx_order_item_status', 'order_items', ['status'])
        op.create_index('idx_order_item_g2a_order_id', 'order_items', ['g2a_order_id'])


def downgrade() -> None:
    # Drop order_items table and its indexes
    op.drop_index('idx_order_item_g2a_order_id', table_name='order_items')
    op.drop_index('idx_order_item_status', table_name='order_items')
    op.drop_index('idx_order_item_product_id', table_name='order_items')
    op.drop_index('idx_order_item_order_id', table_name='order_items')
    op.drop_table('order_items')
    
    # Revert orders table changes - make legacy fields non-nullable again
    op.alter_column('orders', 'price', nullable=False)
    op.alter_column('orders', 'product_id', nullable=False)
    
    # Remove the total_price column
    op.drop_column('orders', 'total_price')
