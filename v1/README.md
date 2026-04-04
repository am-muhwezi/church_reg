# Manifest Kenya Registration Platform v2

<p align="center">
  <img src="logo.png" alt="Manifest Fellowship Kenya" width="400" />
</p>

[![Python Version](https://img.shields.io/badge/python-3.14-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack church member registration and attendance platform built for Manifest Fellowship Kenya. Features a mobile-first member check-in flow, an admin dashboard with analytics, and a RESTful API backend.

## Features

- Member registration with multi-step form
- Check-in flow with name-based search (case-insensitive, swap-tolerant)
- Admin dashboard with attendance analytics and reports
- Role-based access control (admin / super admin)
- JWT authentication
- Dockerised for local development and production

## Project Structure

```
v1/
├── server/       # FastAPI backend (Python 3.14, SQLAlchemy, PostgreSQL)
└── client/       # React 18 frontend (TypeScript, Vite, Tailwind CSS)
```

See [`server/README.md`](server/README.md) and [`client/README.md`](client/README.md) for setup instructions for each service.

## Quick Start (Docker)

```bash
cp .env.prod.example .env
# Edit .env with your values

docker compose -f docker-compose.prod.yml up --build
```

The app will be available at `http://localhost`.

## Environment Variables

Copy `.env.prod.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `JWT_SECRET` | Secret key for JWT signing (`openssl rand -hex 32`) |
| `SEED_ADMIN_NAME` | Name of the first super admin |
| `SEED_ADMIN_EMAIL` | Email of the first super admin |
| `SEED_ADMIN_PASSWORD` | Password of the first super admin |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
