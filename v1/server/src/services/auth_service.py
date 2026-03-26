import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.models.admin import Admin
from src.schemas.auth import AdminCreate, TokenResponse


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(admin: Admin) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(admin.id),
        "email": admin.email,
        "is_super_admin": admin.is_super_admin,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def login(db: AsyncSession, email: str, password: str) -> Optional[TokenResponse]:
    result = await db.execute(select(Admin).where(Admin.email == email))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        return None
    return TokenResponse(
        access_token=_create_token(admin),
        admin_id=str(admin.id),
        admin_name=admin.name,
        admin_email=admin.email,
        is_super_admin=admin.is_super_admin,
    )


async def get_admin_from_token(token: str, db: AsyncSession) -> Optional[Admin]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        admin_id = uuid.UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    return result.scalar_one_or_none()


async def create_admin(db: AsyncSession, data: AdminCreate) -> Admin:
    admin = Admin(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        is_super_admin=data.is_super_admin,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin


async def list_admins(db: AsyncSession) -> list[Admin]:
    result = await db.execute(select(Admin).order_by(Admin.created_at))
    return list(result.scalars().all())


async def delete_admin(db: AsyncSession, admin_id: uuid.UUID) -> bool:
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()
    if not admin or admin.is_super_admin:
        return False
    await db.delete(admin)
    await db.commit()
    return True


async def admin_count(db: AsyncSession) -> int:
    result = await db.execute(select(Admin))
    return len(result.scalars().all())
