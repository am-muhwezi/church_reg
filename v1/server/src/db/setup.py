from typing import AsyncGenerator

from advanced_alchemy.extensions.fastapi import SQLAlchemyAsyncConfig,AsyncSessionConfig

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.engine.url import URL
from src.config import settings




conn_string = URL.create(
"postgresql+asyncpg",
    username=settings.POSTGRES_USER,
    database=settings.POSTGRES_DB,
    password=settings.POSTGRES_PASSWORD,
    host=settings.POSTGRES_HOST,
    port=settings.POSTGRES_PORT,
)
session_config=AsyncSessionConfig(
    expire_on_commit=False,
)

sqlalchemy_config = SQLAlchemyAsyncConfig(
    connection_string=conn_string,
    session_config=session_config,
    create_all=True,
)


# https://youtu.be/MiW_O9e5FO0?t=3863

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with sqlalchemy_config.get_session() as session:
        yield session