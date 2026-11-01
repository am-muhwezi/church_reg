import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


def _blank(v: str | None) -> bool:
    return v is None or not v.strip()


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

    @model_validator(mode="after")
    def students_need_institution(self):
        if self.student:
            if _blank(self.university):
                raise ValueError("University / institution is required for students.")
            if _blank(self.institution_location):
                raise ValueError("Institution location is required for students.")
        return self


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

    @model_validator(mode="after")
    def students_need_institution(self):
        if self.student is True:
            if _blank(self.university):
                raise ValueError("University / institution is required for students.")
            if _blank(self.institution_location):
                raise ValueError("Institution location is required for students.")
        return self


class EventRegistrationCreate(BaseModel):
    first_name: str
    last_name: str
    gender: bool
    phone_number: str | None = None
    student: bool
    institution_or_profession: str | None = None
    first_time: bool
    consent: bool

    @model_validator(mode="after")
    def students_need_institution(self):
        if self.student and _blank(self.institution_or_profession):
            raise ValueError("Institution is required for students.")
        return self


class SaintRead(SaintBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
