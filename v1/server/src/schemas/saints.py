import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SaintBase(BaseModel):
    first_name: str
    last_name: str
    gender: bool
    email: str | None = None
    phone_number: str | None = None
    student: bool
    occupation: str | None = None
    residence: str | None = None
    university: str | None = None
    institution_location: str | None = None
    first_time: bool
    whatsApp_group_consent: bool
    consent_to_share_info: bool


class SaintCreate(SaintBase):
    """Data needed to create a new saint."""
    pass


class SaintUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    gender: bool | None = None
    student: bool | None = None
    occupation: str | None = None
    residence: str | None = None
    university: str | None = None
    institution_location: str | None = None
    first_time: bool | None = None
    whatsApp_group_consent: bool | None = None
    consent_to_share_info: bool | None = None


class SaintRead(SaintBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
