from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.routes.auth import require_admin
from src.db.setup import get_session
from src.schemas.admin import AdminStats, DateRangeReport, ReportData
from src.services.admin_service import get_admin_stats, get_date_range_report, get_report_data

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.get("/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
async def get_stats_route(db: AsyncSession = Depends(get_session)):
    return await get_admin_stats(db)


@admin_router.get("/report", response_model=ReportData, dependencies=[Depends(require_admin)])
async def get_report_route(
    period: Literal["weekly", "monthly", "all"] | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: AsyncSession = Depends(get_session),
):
    return await get_report_data(db, period=period, start_date=start_date, end_date=end_date)


@admin_router.get("/report/details", response_model=DateRangeReport, dependencies=[Depends(require_admin)])
async def get_report_with_details_route(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(get_session),
):
    return await get_date_range_report(db, start_date=start_date, end_date=end_date)
