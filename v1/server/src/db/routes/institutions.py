from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.routes.auth import require_admin
from src.db.setup import get_session
from src.institutions import INSTITUTIONS
from src.schemas.institutions import InstitutionRead, InstitutionTally
from src.services.institution_service import institution_tally

institutions_router = APIRouter(tags=["institutions"])


@institutions_router.get("/institutions", response_model=list[InstitutionRead])
async def list_institutions_route():
    """Public: feeds the registration form autofill."""
    return [InstitutionRead(name=i.name, code=i.code, campus=i.campus) for i in INSTITUTIONS]


@institutions_router.get(
    "/admin/institution-tally", response_model=InstitutionTally, dependencies=[Depends(require_admin)]
)
async def institution_tally_route(
    service_date: date | None = Query(None),
    db: AsyncSession = Depends(get_session),
):
    return await institution_tally(db, service_date or date.today())
