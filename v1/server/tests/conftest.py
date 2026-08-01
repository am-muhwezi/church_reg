import os

# Must be set before any src imports so sqlalchemy_config picks up the test DB
os.environ["POSTGRES_DB"] = "church_reg_test"
os.environ["POSTGRES_HOST"] = "localhost"
os.environ["POSTGRES_USER"] = "postgres"
os.environ["POSTGRES_PASSWORD"] = "ignored"  # trust auth — password not checked
os.environ["POSTGRES_PORT"] = "5432"
os.environ["JWT_SECRET"] = "test-secret-key"
os.environ["CORS_ORIGINS"] = "http://localhost"
os.environ["SEED_ADMIN_EMAIL"] = ""   # disable lifespan seeding
os.environ["SEED_ADMIN_NAME"] = ""
os.environ["SEED_ADMIN_PASSWORD"] = ""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.engine.url import URL

from src.db.models import saints as _saints_model  # noqa: F401 – register models
from src.db.models import attendance as _att_model  # noqa: F401
from src.db.models import admin as _admin_model  # noqa: F401
from advanced_alchemy.base import UUIDAuditBase
from src.db.setup import get_session
from src.schemas.auth import AdminCreate
from src.services.auth_service import create_admin, login
from main import app


_TEST_DB_URL = URL.create(
    "postgresql+asyncpg",
    username="postgres",
    password="ignored",
    host="localhost",
    port=5432,
    database="church_reg_test",
)


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(_TEST_DB_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(UUIDAuditBase.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(UUIDAuditBase.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture(scope="session")
async def db_connection(engine):
    async with engine.connect() as conn:
        yield conn


@pytest_asyncio.fixture
async def db_session(db_connection):
    savepoint = await db_connection.begin_nested()
    session = AsyncSession(bind=db_connection, expire_on_commit=False, join_transaction_mode="create_savepoint")
    yield session
    await session.close()
    await savepoint.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def _override():
        yield db_session

    app.dependency_overrides[get_session] = _override
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Admin fixtures ────────────────────────────────────────────────────────────

SUPER_ADMIN_EMAIL = "super@test.com"
SUPER_ADMIN_PASSWORD = "superpass123"
REGULAR_ADMIN_EMAIL = "regular@test.com"
REGULAR_ADMIN_PASSWORD = "regularpass123"


@pytest_asyncio.fixture
async def super_admin(db_session):
    return await create_admin(
        db_session,
        AdminCreate(
            name="Super Admin",
            email=SUPER_ADMIN_EMAIL,
            password=SUPER_ADMIN_PASSWORD,
            is_super_admin=True,
        ),
    )


@pytest_asyncio.fixture
async def super_admin_token(db_session, super_admin):
    result = await login(db_session, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)
    return result.access_token


@pytest_asyncio.fixture
async def auth_super(super_admin_token):
    return {"Authorization": f"Bearer {super_admin_token}"}


@pytest_asyncio.fixture
async def regular_admin(db_session, super_admin):
    return await create_admin(
        db_session,
        AdminCreate(
            name="Regular Admin",
            email=REGULAR_ADMIN_EMAIL,
            password=REGULAR_ADMIN_PASSWORD,
            is_super_admin=False,
        ),
    )


@pytest_asyncio.fixture
async def regular_admin_token(db_session, regular_admin):
    result = await login(db_session, REGULAR_ADMIN_EMAIL, REGULAR_ADMIN_PASSWORD)
    return result.access_token


@pytest_asyncio.fixture
async def auth_regular(regular_admin_token):
    return {"Authorization": f"Bearer {regular_admin_token}"}


# ── Saint fixtures ────────────────────────────────────────────────────────────

@pytest.fixture
def saint_payload():
    return {
        "first_name": "john",
        "last_name": "doe",
        "gender": True,
        "student": False,
        "first_time": False,
        "whatsApp_group_consent": False,
        "consent_to_share_info": False,
        "email": "john.doe@example.com",
        "phone_number": "+256700000001",
        "occupation": "Engineer",
        "residence": "Kampala",
    }


@pytest_asyncio.fixture
async def registered_saint(client, saint_payload):
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 201
    return resp.json()


# ── Date mocking ──────────────────────────────────────────────────────────────

FIXED_DATE_STR = "2026-01-05"
FIXED_DATE_ISO = "2026-01-05"


@pytest.fixture
def fixed_today(monkeypatch):
    from datetime import date

    class _FixedDate(date):
        @classmethod
        def today(cls):
            return cls(2026, 1, 5)

    monkeypatch.setattr("src.services.checkin_service.date", _FixedDate)
    monkeypatch.setattr("src.services.admin_service.date", _FixedDate)
    return _FixedDate(2026, 1, 5)
