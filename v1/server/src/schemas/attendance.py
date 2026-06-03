import uuid
from datetime import date

from pydantic import BaseModel


class CheckInCreate(BaseModel):
    saint_id: uuid.UUID
    action: str = "confirmed"


class CheckInResponse(BaseModel):
    saint_id: uuid.UUID
    service_date: date
    already_checked_in: bool
    action: str = "confirmed"
