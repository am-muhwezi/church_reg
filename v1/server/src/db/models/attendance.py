import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from advanced_alchemy.base import UUIDAuditBase


class Attendance(UUIDAuditBase):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("saint_id", "service_date", name="uq_saint_service_date"),
    )

    saint_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("saints.id", ondelete="CASCADE"), nullable=False)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmed")

    def __repr__(self):
        return f"Attendance(saint_id={self.saint_id}, service_date={self.service_date})"
