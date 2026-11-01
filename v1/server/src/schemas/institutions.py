from datetime import date

from pydantic import BaseModel


class InstitutionRead(BaseModel):
    name: str            # value to store, e.g. "University of Nairobi (UoN) – Chiromo Campus"
    code: str            # tally code, e.g. "UoN"
    campus: str | None   # prefill for Institution Location


class InstitutionTallyRow(BaseModel):
    code: str
    count: int


class InstitutionTally(BaseModel):
    service_date: date
    total_students: int
    institutions: list[InstitutionTallyRow]
