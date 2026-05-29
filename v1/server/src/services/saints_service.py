import uuid

from advanced_alchemy.exceptions import NotFoundError
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.saints import EventRegistrationCreate, SaintCreate, SaintUpdate
from src.db.repositories.saints_repo import SaintsRepository
from src.db.models.saints import Saint
from src.db.models.attendance import Attendance


async def find_by_email_or_phone(
    db: AsyncSession, email: str | None, phone: str | None
) -> Saint | None:
    conditions = []
    if email:
        conditions.append(Saint.email == email)
    if phone:
        conditions.append(Saint.phone_number == phone)
    if not conditions:
        return None
    result = await db.execute(select(Saint).where(or_(*conditions)).limit(1))
    return result.scalar_one_or_none()


async def register_saint(db: AsyncSession, saint_create: SaintCreate) -> Saint:
    repo = SaintsRepository(session=db)
    data = saint_create.model_dump()
    data['first_name'] = data['first_name'].strip().title()
    data['last_name'] = data['last_name'].strip().title()
    saint = Saint(**data)
    result = await repo.add(saint)
    await db.commit()
    return result


async def update_saint(db: AsyncSession, saint_id: uuid.UUID, data: SaintUpdate) -> Saint | None:
    repo = SaintsRepository(session=db)
    try:
        saint = await repo.get(saint_id)
    except NotFoundError:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        if field in ('first_name', 'last_name') and isinstance(value, str):
            value = value.strip().title()
        setattr(saint, field, value)
    result = await repo.update(saint)
    await db.commit()
    return result


async def search_saint(db: AsyncSession, first_name: str, last_name: str) -> Saint | None:
    repo = SaintsRepository(session=db)
    fn = first_name.strip().title()
    ln = last_name.strip().title()
    saints = await repo.list(first_name=fn, last_name=ln)
    if saints:
        return saints[0]
    # Try swapped order in case the member entered names in reverse
    saints = await repo.list(first_name=ln, last_name=fn)
    return saints[0] if saints else None


async def list_saints(db: AsyncSession) -> list[Saint]:
    repo = SaintsRepository(session=db)
    return await repo.list()


INSTITUTION_KEYWORDS = {"university", "college", "institute", "school", "polytechnic", "campus"}


def _looks_like_institution(value: str) -> bool:
    lower = value.lower()
    return any(kw in lower for kw in INSTITUTION_KEYWORDS)


async def _update_saint_fields(db: AsyncSession, saint: Saint, update_fields: dict) -> Saint:
    repo = SaintsRepository(session=db)
    for field, value in update_fields.items():
        setattr(saint, field, value)
    result = await repo.update(saint)
    await db.commit()
    return result


async def event_register_saint(
    db: AsyncSession, data: EventRegistrationCreate
) -> Saint:
    first_name = data.first_name.strip().title()
    last_name = data.last_name.strip().title()
    phone_number = data.phone_number.strip() if data.phone_number else None
    student = data.student
    institution_or_profession = data.institution_or_profession.strip().title() if data.institution_or_profession else None

    occupation = None
    university = None
    if institution_or_profession:
        if _looks_like_institution(institution_or_profession):
            student = True
            university = institution_or_profession
        else:
            occupation = institution_or_profession

    existing = await search_saint(db, first_name, last_name)
    if not existing:
        existing = await find_by_email_or_phone(db, None, phone_number)

    if existing:
        update_fields = {}
        if phone_number and phone_number != existing.phone_number:
            phone_owner = await find_by_email_or_phone(db, None, phone_number)
            if phone_owner and phone_owner.id != existing.id:
                raise ValueError("This phone number is already registered.")
            update_fields["phone_number"] = phone_number
        if student != existing.student:
            update_fields["student"] = student
        if university and university != existing.university:
            update_fields["university"] = university
        if occupation and occupation != existing.occupation:
            update_fields["occupation"] = occupation
        if data.first_time and not existing.first_time:
            update_fields["first_time"] = True
        if data.consent != existing.consent_to_share_info:
            update_fields["consent_to_share_info"] = data.consent
        if data.consent != existing.whatsApp_group_consent:
            update_fields["whatsApp_group_consent"] = data.consent

        if update_fields:
            existing = await _update_saint_fields(db, existing, update_fields)
        return existing

    if phone_number:
        phone_owner = await find_by_email_or_phone(db, None, phone_number)
        if phone_owner:
            update_fields = {}
            if first_name.title() != phone_owner.first_name or last_name.title() != phone_owner.last_name:
                update_fields["first_name"] = first_name
                update_fields["last_name"] = last_name
            if student != phone_owner.student:
                update_fields["student"] = student
            if occupation and occupation != phone_owner.occupation:
                update_fields["occupation"] = occupation
            if university and university != phone_owner.university:
                update_fields["university"] = university
            if data.first_time and not phone_owner.first_time:
                update_fields["first_time"] = True
            if data.consent != phone_owner.consent_to_share_info:
                update_fields["consent_to_share_info"] = data.consent
            if data.consent != phone_owner.whatsApp_group_consent:
                update_fields["whatsApp_group_consent"] = data.consent
            if update_fields:
                phone_owner = await _update_saint_fields(db, phone_owner, update_fields)
            return phone_owner

    saint = Saint(
        first_name=first_name,
        last_name=last_name,
        email=None,
        phone_number=phone_number,
        gender=data.gender,
        student=student,
        occupation=occupation,
        residence=None,
        university=university,
        institution_location=None,
        first_time=data.first_time,
        whatsApp_group_consent=data.consent,
        consent_to_share_info=data.consent,
    )
    repo = SaintsRepository(session=db)
    result = await repo.add(saint)
    await db.commit()
    return result


async def get_saint_with_stats(db: AsyncSession, saint_id: uuid.UUID):
    """Returns (saint, attendance_count, last_seen) or None."""
    repo = SaintsRepository(session=db)
    try:
        saint = await repo.get(saint_id)
    except NotFoundError:
        return None

    result = await db.execute(
        select(
            func.count().label("count"),
            func.max(Attendance.service_date).label("last_seen"),
        ).where(Attendance.saint_id == saint_id)
    )
    row = result.one()
    return saint, row.count or 0, row.last_seen
