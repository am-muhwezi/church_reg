from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    JWT_SECRET: str = "change-this-secret-before-going-live"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8 hours

    CORS_ORIGINS: str = "http://localhost:5173"

    # First-run seed admin (optional — used only when no admins exist)
    SEED_ADMIN_NAME: str = "yahwehsdelight"
    SEED_ADMIN_EMAIL: str = "intricatesyllable@gmail.com"
    SEED_ADMIN_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
