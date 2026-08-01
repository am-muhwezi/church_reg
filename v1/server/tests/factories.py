import uuid
from datetime import date

from src.db.models.saints import Saint
from src.db.models.attendance import Attendance


def make_saint(**overrides) -> Saint:
    defaults = dict(
        first_name="Test",
        last_name="User",
        gender=True,
        student=False,
        first_time=False,
        whatsApp_group_consent=False,
        consent_to_share_info=False,
    )
    defaults.update(overrides)
    return Saint(**defaults)


def make_attendance(saint_id: uuid.UUID, service_date: date, action: str = "confirmed") -> Attendance:
    return Attendance(saint_id=saint_id, service_date=service_date, action=action)
