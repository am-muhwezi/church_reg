from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from advanced_alchemy.extensions.fastapi import AdvancedAlchemy

from src.config import settings
from src.db.setup import sqlalchemy_config
from src.db.routes.saints import saints_router
from src.db.routes.admin import admin_router
from src.db.routes.auth import auth_router

# Import models so SQLAlchemy registers them for create_all
import src.db.models.saints  # noqa: F401
import src.db.models.attendance  # noqa: F401
import src.db.models.admin  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed first super admin if credentials are configured and no admins exist
    if settings.SEED_ADMIN_EMAIL and settings.SEED_ADMIN_PASSWORD and settings.SEED_ADMIN_NAME:
        from src.db.setup import get_session
        from src.services.auth_service import admin_count, create_admin
        from src.schemas.auth import AdminCreate

        async for db in get_session():
            if await admin_count(db) == 0:
                await create_admin(
                    db,
                    AdminCreate(
                        name=settings.SEED_ADMIN_NAME,
                        email=settings.SEED_ADMIN_EMAIL,
                        password=settings.SEED_ADMIN_PASSWORD,
                        is_super_admin=True,
                    ),
                )
                print(f"[startup] Seeded super admin: {settings.SEED_ADMIN_EMAIL}")
    yield


app = FastAPI(
    title="Church Registration API",
    description="API for managing church registrations and related data.",
    version="2.0.0",
    lifespan=lifespan,
)

cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

alchemy = AdvancedAlchemy(
    config=sqlalchemy_config,
    app=app,
)

app.include_router(saints_router, prefix="/saints", tags=["saints"])
app.include_router(admin_router)
app.include_router(auth_router)
