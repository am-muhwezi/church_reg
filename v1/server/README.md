# Server — Manifest Kenya API

[![Python Version](https://img.shields.io/badge/python-3.14-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688.svg)](https://fastapi.tiangolo.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg)](https://www.sqlalchemy.org)

FastAPI backend for the Manifest Kenya Registration Platform. Provides a RESTful API for member registration, check-in, and admin management backed by PostgreSQL.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.135 |
| ORM | SQLAlchemy 2.0 + advanced-alchemy |
| Database | PostgreSQL (asyncpg) |
| Auth | JWT (python-jose) + bcrypt |
| Runtime | Python 3.14, uv |
| Container | Docker |

## Project Structure

```
src/
├── db/
│   ├── models/         # SQLAlchemy ORM models (saints, attendance, admin)
│   ├── repositories/   # advanced-alchemy async repositories
│   └── routes/         # FastAPI routers (saints, admin, auth)
├── schemas/            # Pydantic request/response schemas
├── services/           # Business logic (saints, checkin, auth)
└── config.py           # Settings from environment variables
main.py                 # App entry point, lifespan, middleware
```

## API Endpoints

### Members
| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/saints/register` | Register a new member | Public |
| `GET` | `/saints/search` | Search member by name | Public |
| `POST` | `/saints/checkin` | Check in a member | Public |
| `GET` | `/saints` | List all members | Admin |
| `GET` | `/saints/{id}` | Get member with stats | Admin |
| `PATCH` | `/saints/{id}` | Update member details | Admin |

### Admin
| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Admin login, returns JWT | Public |
| `GET` | `/admin/stats` | Dashboard statistics | Admin |
| `GET` | `/admin/report` | Attendance report | Admin |

## Local Development

### Prerequisites

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL (or use Docker Compose)

### Setup

1. Install dependencies
```bash
uv sync
```

2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

Required variables:

| Variable | Example |
|---|---|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `secret` |
| `POSTGRES_DB` | `manifest` |
| `POSTGRES_HOST` | `localhost` |
| `POSTGRES_PORT` | `5432` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `SEED_ADMIN_EMAIL` | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | `strongpassword` |
| `SEED_ADMIN_NAME` | `Admin Name` |
| `CORS_ORIGINS` | `http://localhost:5173` |

3. Run the development server
```bash
uv run fastapi dev main.py
```

API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Docker

```bash
docker compose up --build
```

## Database

The app uses `create_all=True` — tables are created automatically on startup. No migration tool is needed for schema changes in development; for production schema changes, run `ALTER TABLE` commands directly against the database.
