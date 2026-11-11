from collections import Counter
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.attendance import Attendance
from src.db.models.saints import Saint
from src.institutions import OTHERS, bucket_code
from src.schemas.institutions import InstitutionTally, InstitutionTallyRow


def build_tally(service_date: date, universities: list[str | None]) -> InstitutionTally:
    """One entry per student present that day. Pure: no I/O."""
    counts = Counter(bucket_code(u) for u in universities)
    rows = [InstitutionTallyRow(code=k, count=n) for k, n in counts.items()]
    rows.sort(key=lambda r: (r.code == OTHERS, -r.count, r.code.casefold()))  # OTHERS always last
    return InstitutionTally(service_date=service_date, total_students=len(universities), institutions=rows)


async def institution_tally(db: AsyncSession, service_date: date) -> InstitutionTally:
    """Students who checked in on `service_date`, grouped by institution."""
    result = await db.execute(
        select(Saint.university)
        .join(Attendance, Attendance.saint_id == Saint.id)
        .where(Attendance.service_date == service_date, Saint.student.is_(True))
    )
    return build_tally(service_date, [r[0] for r in result.all()])
