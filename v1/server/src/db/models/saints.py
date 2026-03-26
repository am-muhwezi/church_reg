from sqlalchemy import Boolean, String

from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy.orm import Mapped, mapped_column

class Saint(UUIDAuditBase):
    __tablename__ = "saints"

    first_name: Mapped[str] = mapped_column(nullable=False)
    last_name: Mapped[str] = mapped_column(nullable=False)

    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    student: Mapped[bool] = mapped_column(Boolean, nullable=False)
    gender: Mapped[bool] = mapped_column(Boolean, nullable=False)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    residence: Mapped[str | None] = mapped_column(String(100), nullable=True)
    university: Mapped[str | None] = mapped_column(String(200), nullable=True)
    institution_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    first_time: Mapped[bool] = mapped_column(Boolean, nullable=False)
    whatsApp_group_consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    consent_to_share_info: Mapped[bool] = mapped_column(Boolean, nullable=False)


    def __repr__(self):
        return f"Saint(first_name='{self.first_name}', last_name='{self.last_name}')"
