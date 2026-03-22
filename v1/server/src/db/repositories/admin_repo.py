from advanced_sqlalchemy import SQLAlchemyAsyncRepository
from ..models.admin import Admin


class AdminRepository(SQLAlchemyAsyncRepository):
    model_type = Admin