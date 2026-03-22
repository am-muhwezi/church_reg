from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.schemas.saints import SaintCreate

from src.services.saints_service import register_saint, welcome_saint_service
from src.db.setup import get_session
from src.db.repositories.dependencies.saints import get_saints_repo


saints_router = APIRouter(
    prefix="",
    tags=["saints"]
)


@saints_router.post("/register")
async def register_saint_route(
    data: SaintCreate, db: AsyncSession = Depends(get_session)
):
    return await register_saint(db, data)

@saints_router.get("/welcome")
async def welcome_saint(
        first_name: str,
        last_name: str,
        db: AsyncSession = Depends(get_session)
):
    return await welcome_saint_service(db, first_name, last_name)   