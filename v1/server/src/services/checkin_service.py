import uuid
from datetime import date

from advanced_alchemy.exceptions import IntegrityError
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.attendance import Attendance
from src.db.models.saints import Saint
from src.db.repositories.attendance_repo import AttendanceRepository
from src.schemas.attendance import CheckInResponse


async def check_in_saint(db: AsyncSession, saint_id: uuid.UUID) -> CheckInResponse:
    today = date.today()

    saint_exists = await db.scalar(select(select(Saint).where(Saint.id == saint_id).exists()))
    if not saint_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saint not found")

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
    try:
        await repo.add(attendance)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return CheckInResponse(
            saint_id=saint_id,
            service_date=today,
            already_checked_in=True,
        )

    return CheckInResponse(
        saint_id=saint_id,
        service_date=today,
        already_checked_in=False,
    )
