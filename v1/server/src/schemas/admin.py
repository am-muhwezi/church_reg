import uuid
from datetime import date

from pydantic import BaseModel

from src.schemas.saints import SaintRead


class SaintWithStats(SaintRead):
    attendance_count: int = 0
    last_seen: date | None = None


class AttendanceTrend(BaseModel):
    date: date
    count: int


class NewTodaySaint(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    occupation: str | None
    university: str | None
    student: bool


class AdminStats(BaseModel):
    total_registered: int
    today_checkins: int
    this_month: int
    avg_attendance: float
    attendance_trend: list[AttendanceTrend]
    new_today: list[NewTodaySaint]


class AttendanceLogEntry(BaseModel):
    date: date
    count: int
    new_visitors: int


class ReportData(BaseModel):
    total_registered: int
    today_checkins: int
    this_month: int
    whatsapp_count: int
    avg_attendance: float
    male_count: int
    female_count: int
    student_count: int
    professional_count: int
    first_time_today: int
    attendance_log: list[AttendanceLogEntry]
