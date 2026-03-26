from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from src.db.models.attendance import Attendance


class AttendanceRepository(SQLAlchemyAsyncRepository[Attendance]):
    model_type = Attendance
