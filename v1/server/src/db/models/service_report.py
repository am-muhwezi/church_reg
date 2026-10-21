import uuid
from datetime import date

from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class Center(UUIDAuditBase):
    __tablename__ = "centers"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    kind: Mapped[str] = mapped_column(String(20), nullable=False)  # residential | institution
    is_main: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class AdminCenter(UUIDAuditBase):
    """Which center an admin files reports for. Kept out of `admins` so create_all needs no migration."""

    __tablename__ = "admin_centers"

    admin_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("admins.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    center_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("centers.id", ondelete="CASCADE"), nullable=False)


class ServiceReport(UUIDAuditBase):
    __tablename__ = "service_reports"
    __table_args__ = (
        UniqueConstraint("center_id", "service_date", "service_number", name="uq_center_date_service_number"),
    )

    center_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("centers.id", ondelete="CASCADE"), nullable=False)
    service_date: Mapped[date] = mapped_column(Date, nullable=False)
    service_type: Mapped[str] = mapped_column(String(20), nullable=False)  # thursday | sunday
    service_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    venue: Mapped[str] = mapped_column(String(200), nullable=False)
    male: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    female: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    children: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    serving_team: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    first_timers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    new_converts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("admins.id", ondelete="SET NULL"), nullable=True
    )
