"""Add account linking constraints

Revision ID: add_account_linking_constraints
Revises: c7d75e2f93f8
Create Date: 2025-09-08 09:43:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_account_linking_constraints'
down_revision = 'c7d75e2f93f8'
branch_labels = None
depends_on = None


def upgrade():
    # Add unique constraint to prevent duplicate social accounts per provider per user
    op.create_unique_constraint(
        'uq_social_accounts_user_provider',
        'social_accounts',
        ['user_id', 'provider']
    )
    
    # Add unique constraint to prevent duplicate provider IDs per provider
    op.create_unique_constraint(
        'uq_social_accounts_provider_id_provider',
        'social_accounts',
        ['provider_id', 'provider']
    )
    
    # Add index for faster lookups by email in social accounts
    op.create_index(
        'ix_social_accounts_email',
        'social_accounts',
        ['email']
    )


def downgrade():
    # Remove the constraints and index
    op.drop_constraint('uq_social_accounts_user_provider', 'social_accounts', type_='unique')
    op.drop_constraint('uq_social_accounts_provider_id_provider', 'social_accounts', type_='unique')
    op.drop_index('ix_social_accounts_email', 'social_accounts')
