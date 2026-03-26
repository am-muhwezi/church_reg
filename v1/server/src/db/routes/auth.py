import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.setup import get_session
from src.schemas.auth import AdminCreate, AdminRead, LoginRequest, TokenResponse
from src.services.auth_service import (
    admin_count,
    create_admin,
    delete_admin,
    get_admin_from_token,
    list_admins,
    login,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
_bearer = HTTPBearer()


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_session),
):
    admin = await get_admin_from_token(credentials.credentials, db)
    if not admin:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return admin


async def require_super_admin(admin=Depends(require_admin)):
    if not admin.is_super_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Super admin access required")
    return admin


@auth_router.post("/login", response_model=TokenResponse)
async def login_route(data: LoginRequest, db: AsyncSession = Depends(get_session)):
    result = await login(db, data.email, data.password)
    if not result:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return result


@auth_router.post("/setup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def setup_route(data: AdminCreate, db: AsyncSession = Depends(get_session)):
    """Create the first super admin. Only works when no admins exist."""
    if await admin_count(db) > 0:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Setup already complete")
    data.is_super_admin = True
    admin = await create_admin(db, data)
    return await login(db, admin.email, data.password)


@auth_router.get("/me", response_model=AdminRead)
async def me_route(admin=Depends(require_admin)):
    return admin


@auth_router.get("/admins", response_model=list[AdminRead])
async def list_admins_route(
    _=Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return await list_admins(db)


@auth_router.post("/admins", response_model=AdminRead, status_code=status.HTTP_201_CREATED)
async def create_admin_route(
    data: AdminCreate,
    _=Depends(require_super_admin),
    db: AsyncSession = Depends(get_session),
):
    return await create_admin(db, data)


@auth_router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_route(
    admin_id: uuid.UUID,
    _=Depends(require_super_admin),
    db: AsyncSession = Depends(get_session),
):
    ok = await delete_admin(db, admin_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Admin not found or cannot be removed")
