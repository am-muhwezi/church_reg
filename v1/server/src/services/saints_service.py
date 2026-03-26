import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.saints import SaintCreate
from src.db.repositories.saints_repo import SaintsRepository
from src.db.models.saints import Saint
from src.db.models.attendance import Attendance


async def register_saint(db: AsyncSession, saint_create: SaintCreate) -> Saint:
    repo = SaintsRepository(session=db)
    saint = Saint(**saint_create.model_dump())
    result = await repo.add(saint)
    await db.commit()
    return result


async def search_saint(db: AsyncSession, first_name: str, last_name: str) -> Saint | None:
    repo = SaintsRepository(session=db)
    saints = await repo.list(first_name=first_name, last_name=last_name)
    if not saints:
        return None
    return saints[0]


async def list_saints(db: AsyncSession) -> list[Saint]:
    repo = SaintsRepository(session=db)
    return await repo.list()


async def get_saint_with_stats(db: AsyncSession, saint_id: uuid.UUID):
    """Returns (saint, attendance_count, last_seen) or None."""
    repo = SaintsRepository(session=db)
    saint = await repo.get(saint_id)
    if not saint:
        return None

    result = await db.execute(
        select(
            func.count().label("count"),
            func.max(Attendance.service_date).label("last_seen"),
        ).where(Attendance.saint_id == saint_id)
    )
    row = result.one()
    return saint, row.count or 0, row.last_seen
