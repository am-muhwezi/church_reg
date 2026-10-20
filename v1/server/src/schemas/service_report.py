import uuid
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CenterRead(BaseModel):
    id: uuid.UUID
    name: str
    kind: str
    is_main: bool
    model_config = ConfigDict(from_attributes=True)


class AdminCenterAssign(BaseModel):
    center_id: uuid.UUID | None = None


class AdminCenterRead(BaseModel):
    admin_id: uuid.UUID
    center_id: uuid.UUID


class MyCenter(BaseModel):
    center: CenterRead | None
    is_super_admin: bool


class ServiceReportCreate(BaseModel):
    """center_id is ignored for center admins (their assigned center is used)."""

    center_id: uuid.UUID | None = None
    service_date: date
    service_type: Literal["thursday", "sunday"]
    service_number: int = Field(1, ge=1, le=10)
    venue: str = Field(..., min_length=1, max_length=200)
    male: int = Field(0, ge=0, le=100000)
    female: int = Field(0, ge=0, le=100000)
    children: int = Field(0, ge=0, le=100000)
    serving_team: int = Field(0, ge=0, le=100000)
    first_timers: int = Field(0, ge=0, le=100000)
    new_converts: int = Field(0, ge=0, le=100000)


class ServiceReportRead(BaseModel):
    id: uuid.UUID
    center_id: uuid.UUID
    center_name: str
    service_date: date
    service_type: str
    service_number: int
    venue: str
    male: int
    female: int
    children: int
    total_attendance: int
    serving_team: int
    first_timers: int
    new_converts: int
