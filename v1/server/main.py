from fastapi import FastAPI
from advanced_alchemy.extensions.fastapi import AdvancedAlchemy
from src.db.setup import sqlalchemy_config
from src.db.routes.saints import saints_router


app = FastAPI(
    title="Church Registration API",
    description="API for managing church registrations and related data.",
    version="2.0.0",
)

alchemy = AdvancedAlchemy(
    config=sqlalchemy_config,
    app=app,
)

app.include_router(saints_router, prefix="/saints", tags=["saints"])