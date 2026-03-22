import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SaintBase(BaseModel):
    first_name: str
    last_name: str
    gender: bool
    email: str
    student: bool
    occupation: str
    first_time: bool
    whatsApp_group_consent: bool
    consent_to_share_info: bool


class SaintCreate(SaintBase):
    """Data Needed to create a New saint"""
    first_name: str
    last_name: str

class SaintRead(SaintBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

