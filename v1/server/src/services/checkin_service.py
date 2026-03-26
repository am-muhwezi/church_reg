import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.attendance import Attendance
from src.db.repositories.attendance_repo import AttendanceRepository
from src.schemas.attendance import CheckInResponse


async def check_in_saint(db: AsyncSession, saint_id: uuid.UUID) -> CheckInResponse:
    today = date.today()

    result = await db.execute(
        select(Attendance).where(
            Attendance.saint_id == saint_id,
            Attendance.service_date == today,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        return CheckInResponse(
            saint_id=saint_id,
            service_date=today,
            already_checked_in=True,
        )

    repo = AttendanceRepository(session=db)
    attendance = Attendance(saint_id=saint_id, service_date=today)
    await repo.add(attendance)
    await db.commit()

    return CheckInResponse(
        saint_id=saint_id,
        service_date=today,
        already_checked_in=False,
    )
