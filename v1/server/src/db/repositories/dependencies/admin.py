from src.db.setup import get_session
from ..reositories.admin_repo import AdminRepository
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends


def get_admin_repo(db_session: AsyncSession = Depends(get_session)) -> AdminRepository:
    return AdminRepository(session=db_session)
