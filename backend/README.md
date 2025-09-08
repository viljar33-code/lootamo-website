# Lootamo E-commerce Backend

Production-ready e-commerce backend built with FastAPI, featuring authentication, RBAC, and scalable architecture.

## Features

### Phase 1 - Authentication & User Management ✅
- JWT-based authentication with access/refresh tokens
- Role-based access control (RBAC)
- User registration, login, logout
- Password hashing with bcrypt
- Rate limiting middleware
- Session management
- User profile management

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy (async)
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt
- **Caching**: Redis
- **Migrations**: Alembic
- **Testing**: pytest

## Quick Start

### 1. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your database and Redis credentials
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Initialize Alembic
alembic init alembic

# Create first migration
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head
```

### 4. Run the Server

```bash
# Development
python -m app.main

# Or with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - Logout user

### Google OAuth
- `GET /api/v1/auth/google/login` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback
- `POST /api/v1/auth/google/token` - Exchange Google token
- `DELETE /api/v1/auth/google/unlink` - Unlink Google account
- `GET /api/v1/auth/google/status` - Check Google link status

### Facebook OAuth
- `GET /api/v1/auth/facebook/login` - Initiate Facebook OAuth
- `GET /api/v1/auth/facebook/callback` - Facebook OAuth callback
- `POST /api/v1/auth/facebook/token` - Exchange Facebook token
- `DELETE /api/v1/auth/facebook/unlink` - Unlink Facebook account
- `GET /api/v1/auth/facebook/status` - Check Facebook link status

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/` - List users (admin/manager)
- `GET /api/v1/users/{id}` - Get user by ID (admin/manager)
- `PUT /api/v1/users/{id}/activate` - Activate user (admin)
- `PUT /api/v1/users/{id}/deactivate` - Deactivate user (admin)

## User Roles

- **Customer**: Default role, basic access
- **Supplier**: Can manage their products/catalog
- **Manager**: Can view users and basic admin functions
- **Admin**: Full system access

## Security Features

- JWT tokens with configurable expiration
- Password hashing with bcrypt
- Rate limiting (60 requests/minute by default)
- CORS protection
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy

## Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/lootamo_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_PER_MINUTE=60
```

## Development

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Testing
```bash
pytest
```

## Next Phases

- **Phase 2**: Supplier API & Catalog Sync
- **Phase 3**: Checkout & Payments
- **Phase 4**: License Fulfillment
- **Phase 5**: Admin Dashboard
- **Phase 6**: SEO & Performance
