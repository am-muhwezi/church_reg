import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.routes.auth import require_admin, require_super_admin
from src.db.setup import get_session
from src.schemas.service_report import (
    AdminCenterAssign,
    AdminCenterRead,
    CenterRead,
    MyCenter,
    ServiceReportCreate,
    ServiceReportRead,
)
from src.services import report_builder as rb
from src.services import service_report_service as svc

service_reports_router = APIRouter(prefix="/service-reports", tags=["service-reports"])


async def _acting_center_id(admin, db: AsyncSession, requested: uuid.UUID | None) -> uuid.UUID:
    assignment = await svc.get_assignment(db, admin.id)
    try:
        return svc.resolve_center_id(
            admin.is_super_admin, assignment.center_id if assignment else None, requested
        )
    except svc.CenterAccessError as e:
        raise HTTPException(e.status, e.detail)


@service_reports_router.get("/centers", response_model=list[CenterRead])
async def list_centers_route(_=Depends(require_admin), db: AsyncSession = Depends(get_session)):
    return await svc.list_centers(db)


@service_reports_router.get("/me", response_model=MyCenter)
async def my_center_route(admin=Depends(require_admin), db: AsyncSession = Depends(get_session)):
    assignment = await svc.get_assignment(db, admin.id)
    center = await svc.get_center(db, assignment.center_id) if assignment else None
    return MyCenter(center=center, is_super_admin=admin.is_super_admin)


@service_reports_router.get("/assignments", response_model=list[AdminCenterRead])
async def list_assignments_route(_=Depends(require_super_admin), db: AsyncSession = Depends(get_session)):
    return await svc.list_assignments(db)


@service_reports_router.put("/assignments/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def assign_center_route(
    admin_id: uuid.UUID,
    data: AdminCenterAssign,
    _=Depends(require_super_admin),
    db: AsyncSession = Depends(get_session),
):
    if data.center_id and not await svc.get_center(db, data.center_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Center not found")
    await svc.assign_center(db, admin_id, data.center_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@service_reports_router.post("", response_model=ServiceReportRead, status_code=status.HTTP_201_CREATED)
async def create_report_route(
    data: ServiceReportCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    center_id = await _acting_center_id(admin, db, data.center_id)
    center = await svc.get_center(db, center_id)
    if not center:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Center not found")
    created = await svc.create_report(db, data, center, admin.id)
    if created is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{center.name} already has a Service {data.service_number} report for {data.service_date}",
        )
    return created


@service_reports_router.get("", response_model=list[ServiceReportRead])
async def list_reports_route(
    center_id: uuid.UUID | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    if not admin.is_super_admin:
        center_id = await _acting_center_id(admin, db, center_id)
    return await svc.list_reports(db, center_id, start_date, end_date)


@service_reports_router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report_route(
    report_id: uuid.UUID,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    scope = None if admin.is_super_admin else await _acting_center_id(admin, db, None)
    if not await svc.delete_report(db, report_id, scope):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@service_reports_router.get("/weekly")
async def weekly_route(
    week_start: date = Query(..., description="Any date in the week; Monday is derived"),
    center_id: uuid.UUID | None = Query(None),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    acting = await _acting_center_id(admin, db, center_id)
    center = await svc.get_center(db, acting)
    monday = rb.week_start_of(week_start)
    rows = await svc.fetch_rows(db, monday, monday + timedelta(days=6), acting)
    report = rb.weekly_report(rows, monday)
    report["center"] = center.name if center else ""
    return report


def _period_or_422(parse, value: str) -> rb.Period:
    try:
        return parse(value)
    except ValueError as e:
        raise HTTPException(422, str(e))


async def _period_payload(db: AsyncSession, period: rb.Period) -> dict:
    # Current + previous period for variance, plus all earlier months for the history slide.
    rows = await svc.fetch_rows(db, date(2000, 1, 1), period.end)
    return rb.period_report(rows, period)


@service_reports_router.get("/monthly")
async def monthly_route(
    month: str = Query(..., description="YYYY-MM"),
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return await _period_payload(db, _period_or_422(rb.parse_month, month))


@service_reports_router.get("/quarterly")
async def quarterly_route(
    quarter: str = Query(..., description="YYYY-Q1..Q4, e.g. 2026-Q3"),
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return await _period_payload(db, _period_or_422(rb.parse_quarter, quarter))
