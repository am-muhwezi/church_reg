from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from src.db.models.saints import Saint

class SaintsRepository(SQLAlchemyAsyncRepository[Saint]):
    model_type = Saint
