import uuid
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.service_report import AdminCenter, Center, ServiceReport
from src.schemas.service_report import ServiceReportCreate, ServiceReportRead
from src.services.report_builder import ReportRow

SEED_CENTERS: list[tuple[str, str, bool]] = [
    ("Nairobi", "residential", True),
    ("Kisumu", "residential", False),
    ("Mombasa", "residential", False),
    ("Eldoret", "residential", False),
    ("SEKU", "institution", False),
    ("MiNaP", "institution", False),
    ("Egerton", "institution", False),
    ("KCHS", "institution", False),
]


class CenterAccessError(Exception):
    def __init__(self, status: int, detail: str):
        self.status, self.detail = status, detail


def resolve_center_id(
    is_super_admin: bool, assigned: uuid.UUID | None, requested: uuid.UUID | None
) -> uuid.UUID:
    """Which center this request acts on. Center admins are pinned to their own."""
    if is_super_admin:
        if requested is None:
            raise CenterAccessError(400, "center_id is required for super admins")
        return requested
    if assigned is None:
        raise CenterAccessError(403, "No center is assigned to your account. Ask a super admin.")
    if requested is not None and requested != assigned:
        raise CenterAccessError(403, "You can only file reports for your own center")
    return assigned


async def seed_centers(db: AsyncSession) -> int:
    existing = {c for (c,) in (await db.execute(select(Center.name))).all()}
    added = 0
    for i, (name, kind, is_main) in enumerate(SEED_CENTERS):
        if name not in existing:
            db.add(Center(name=name, kind=kind, is_main=is_main, sort_order=i))
            added += 1
    if added:
        await db.commit()
    return added


async def list_centers(db: AsyncSession) -> list[Center]:
    return list((await db.execute(select(Center).order_by(Center.sort_order, Center.name))).scalars().all())


async def get_assignment(db: AsyncSession, admin_id: uuid.UUID) -> AdminCenter | None:
    return (await db.execute(select(AdminCenter).where(AdminCenter.admin_id == admin_id))).scalar_one_or_none()


async def list_assignments(db: AsyncSession) -> list[AdminCenter]:
    return list((await db.execute(select(AdminCenter))).scalars().all())


async def assign_center(db: AsyncSession, admin_id: uuid.UUID, center_id: uuid.UUID | None) -> None:
    await db.execute(delete(AdminCenter).where(AdminCenter.admin_id == admin_id))
    if center_id is not None:
        db.add(AdminCenter(admin_id=admin_id, center_id=center_id))
    await db.commit()


def _to_read(report: ServiceReport, center_name: str) -> ServiceReportRead:
    return ServiceReportRead(
        id=report.id,
        center_id=report.center_id,
        center_name=center_name,
        service_date=report.service_date,
        service_type=report.service_type,
        service_number=report.service_number,
        venue=report.venue,
        male=report.male,
        female=report.female,
        children=report.children,
        total_attendance=report.male + report.female + report.children,
        serving_team=report.serving_team,
        first_timers=report.first_timers,
        new_converts=report.new_converts,
    )


async def create_report(
    db: AsyncSession, data: ServiceReportCreate, center: Center, admin_id: uuid.UUID
) -> ServiceReportRead | None:
    """None when this center already filed that service number for that date."""
    dup = await db.scalar(
        select(ServiceReport.id).where(
            ServiceReport.center_id == center.id,
            ServiceReport.service_date == data.service_date,
            ServiceReport.service_number == data.service_number,
        )
    )
    if dup:
        return None
    report = ServiceReport(
        center_id=center.id,
        submitted_by=admin_id,
        **data.model_dump(exclude={"center_id"}),
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return _to_read(report, center.name)


async def get_center(db: AsyncSession, center_id: uuid.UUID) -> Center | None:
    return (await db.execute(select(Center).where(Center.id == center_id))).scalar_one_or_none()


async def list_reports(
    db: AsyncSession,
    center_id: uuid.UUID | None = None,
    start: date | None = None,
    end: date | None = None,
) -> list[ServiceReportRead]:
    q = select(ServiceReport, Center.name).join(Center, Center.id == ServiceReport.center_id)
    if center_id:
        q = q.where(ServiceReport.center_id == center_id)
    if start:
        q = q.where(ServiceReport.service_date >= start)
    if end:
        q = q.where(ServiceReport.service_date <= end)
    q = q.order_by(ServiceReport.service_date.desc(), ServiceReport.service_number, Center.name)
    return [_to_read(r, name) for r, name in (await db.execute(q)).all()]


async def delete_report(db: AsyncSession, report_id: uuid.UUID, center_id: uuid.UUID | None) -> bool:
    """center_id restricts deletion to one center (center admins). None = any (super admin)."""
    q = select(ServiceReport).where(ServiceReport.id == report_id)
    if center_id:
        q = q.where(ServiceReport.center_id == center_id)
    report = (await db.execute(q)).scalar_one_or_none()
    if not report:
        return False
    await db.delete(report)
    await db.commit()
    return True


async def fetch_rows(
    db: AsyncSession,
    start: date,
    end: date,
    center_id: uuid.UUID | None = None,
) -> list[ReportRow]:
    q = (
        select(ServiceReport, Center)
        .join(Center, Center.id == ServiceReport.center_id)
        .where(ServiceReport.service_date >= start, ServiceReport.service_date <= end)
    )
    if center_id:
        q = q.where(ServiceReport.center_id == center_id)
    return [
        ReportRow(
            center=c.name,
            center_kind=c.kind,
            is_main=c.is_main,
            service_date=r.service_date,
            service_type=r.service_type,
            service_number=r.service_number,
            male=r.male,
            female=r.female,
            children=r.children,
            serving_team=r.serving_team,
            first_timers=r.first_timers,
            new_converts=r.new_converts,
            venue=r.venue,
            order=c.sort_order,
        )
        for r, c in (await db.execute(q)).all()
    ]
