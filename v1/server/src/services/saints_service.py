import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.saints import SaintCreate, SaintUpdate
from src.db.repositories.saints_repo import SaintsRepository
from src.db.models.saints import Saint
from src.db.models.attendance import Attendance


async def register_saint(db: AsyncSession, saint_create: SaintCreate) -> Saint:
    repo = SaintsRepository(session=db)
    data = saint_create.model_dump()
    data['first_name'] = data['first_name'].strip().title()
    data['last_name'] = data['last_name'].strip().title()
    saint = Saint(**data)
    result = await repo.add(saint)
    await db.commit()
    return result


async def update_saint(db: AsyncSession, saint_id: uuid.UUID, data: SaintUpdate) -> Saint | None:
    repo = SaintsRepository(session=db)
    saint = await repo.get(saint_id)
    if saint is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        if field in ('first_name', 'last_name') and isinstance(value, str):
            value = value.strip().title()
        setattr(saint, field, value)
    result = await repo.update(saint)
    await db.commit()
    return result


async def search_saint(db: AsyncSession, first_name: str, last_name: str) -> Saint | None:
    repo = SaintsRepository(session=db)
    fn = first_name.strip().title()
    ln = last_name.strip().title()
    saints = await repo.list(first_name=fn, last_name=ln)
    if saints:
        return saints[0]
    # Try swapped order in case the member entered names in reverse
    saints = await repo.list(first_name=ln, last_name=fn)
    return saints[0] if saints else None


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
