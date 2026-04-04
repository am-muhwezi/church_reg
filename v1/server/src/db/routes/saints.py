import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.routes.auth import require_admin
from src.schemas.saints import SaintCreate, SaintRead, SaintUpdate
from src.schemas.admin import SaintWithStats
from src.schemas.attendance import CheckInCreate, CheckInResponse
from src.services.saints_service import (
    register_saint,
    update_saint,
    search_saint,
    list_saints,
    get_saint_with_stats,
)
from src.services.checkin_service import check_in_saint
from src.db.setup import get_session
from advanced_alchemy.exceptions import DuplicateKeyError


saints_router = APIRouter(prefix="", tags=["saints"])


@saints_router.post("/register", status_code=status.HTTP_201_CREATED, response_model=SaintRead)
async def register_saint_route(
    data: SaintCreate,
    db: AsyncSession = Depends(get_session),
):
    try:
        return await register_saint(db, data)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already registered.",
        )


@saints_router.get("/search", response_model=SaintRead)
async def search_saint_route(
    first_name: str,
    last_name: str,
    db: AsyncSession = Depends(get_session),
):
    saint = await search_saint(db, first_name, last_name)
    if saint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saint not found")
    return saint


@saints_router.get("", response_model=list[SaintRead], dependencies=[Depends(require_admin)])
async def list_saints_route(db: AsyncSession = Depends(get_session)):
    return await list_saints(db)


@saints_router.get("/{saint_id}", response_model=SaintWithStats, dependencies=[Depends(require_admin)])
async def get_saint_route(
    saint_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
):
    result = await get_saint_with_stats(db, saint_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saint not found")
    saint, attendance_count, last_seen = result
    return SaintWithStats.model_validate(
        {**saint.__dict__, "attendance_count": attendance_count, "last_seen": last_seen}
    )


@saints_router.patch("/{saint_id}", response_model=SaintRead, dependencies=[Depends(require_admin)])
async def update_saint_route(
    saint_id: uuid.UUID,
    data: SaintUpdate,
    db: AsyncSession = Depends(get_session),
):
    saint = await update_saint(db, saint_id, data)
    if saint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saint not found")
    return saint


@saints_router.post("/checkin", response_model=CheckInResponse)
async def checkin_saint_route(
    data: CheckInCreate,
    db: AsyncSession = Depends(get_session),
):
    return await check_in_saint(db, data.saint_id)
