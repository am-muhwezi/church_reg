from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column


class Admin(UUIDAuditBase):
    __tablename__ = "admins"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    is_super_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
