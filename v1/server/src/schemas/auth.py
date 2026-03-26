import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: str
    admin_name: str
    admin_email: str
    is_super_admin: bool


class AdminRead(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    is_super_admin: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AdminCreate(BaseModel):
    name: str
    email: str
    password: str
    is_super_admin: bool = False
