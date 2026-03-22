from advanced_alchemy.base import UUIDAuditBase
from sqlalchemy import Mapped


class Admin(UUIDAuditBase):
    __tablename__ = "admins"

    # Define your admin-specific fields here, for example:
    username: Mapped[str]  # Add appropriate column definition
    email: Mapped[str]     # Add appropriate column definition
    password_hash: Mapped[str]  # Add appropriate column definition

    def __repr__(self):
        return f"Admin(username='{self.username}', email='{self.email}')"