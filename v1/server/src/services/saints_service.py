from sqlalchemy.ext.asyncio import AsyncSession
from src.schemas.saints import SaintCreate
from src.db.repositories.saints_repo import SaintsRepository
from src.db.models.saints import Saint



async def register_saint(db: AsyncSession, saint_create: SaintCreate):
    repo = SaintsRepository(session=db)
    saint = Saint(**saint_create.model_dump())  # convert Pydantic schema → SQLAlchemy model
    result = await repo.add(saint)              # add() saves it to the database
    return result

async def welcome_saint_service(db : AsyncSession, first_name: str, last_name: str) -> str:
    repo = SaintsRepository(session=db)

    saint = await repo.get_by_kwargs(first_name=first_name, last_name=last_name)
    if saint:
        return {"message": f"Welcome, {saint.first_name} {saint.last_name}!"}
    return {"message": "Saint not found."}