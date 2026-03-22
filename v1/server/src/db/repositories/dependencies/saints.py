from src.db.setup import get_session
from ...repositories.saints_repo import SaintsRepository
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends


def get_saints_repo(db_session: AsyncSession = Depends(get_session)) -> SaintsRepository:
    return SaintsRepository(session=db_session)