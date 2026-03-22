from fastapi import APIRouter

from src.db.repositories.dependencies.saints import get_saints_repo

admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"]
)

@admin_router.post("/")
async def create_admin():
    return {"message": "Admin created successfully."}