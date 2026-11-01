"""Master list of institutions students can register under.

Deterministic, no DB: the autofill endpoint serves INSTITUTIONS, and the tally
groups every stored `Saint.university` value by `tally_key`. Multi-campus
institutions (UoN, KMTC, JKUAT) share one tally code.
"""
import re
from dataclasses import dataclass

# Source list as supplied by the church. Format: "<Name> [(ACRONYM)] [– <Campus>]".
RAW_INSTITUTIONS = [
    "University of Nairobi (UoN) – Main Campus",
    "University of Nairobi (UoN) – Chiromo Campus",
    "University of Nairobi (UoN) – Upper Kabete Campus",
    "University of Nairobi (UoN) – Parklands Campus",
    "University of Nairobi (UoN) – Kikuyu Campus",
    "University of Nairobi (UoN) – Lower Kabete Campus",
    "South Eastern Kenya University (SEKU)",
    "East African School of Aviation (EASA)",
    "Arizona International College",
    "Jomo Kenyatta University of Agriculture and Technology (JKUAT)",
    "Jomo Kenyatta University of Agriculture and Technology (JKUAT) – Karen Campus",
    "Nairobi Women's Hospital College",
    "Daystar University",
    "Strathmore University",
    "Multimedia University of Kenya (MMU)",
    "Kenya Medical Training College (KMTC) – Manza Campus",
    "Kenyatta University (KU)",
    "Michuki Technical Training Institute",
    "United States International University-Africa (USIU-Africa)",
    "Kenya Medical Training College (KMTC)",
    "Technical University of Kenya (TUK)",
    "Kenya Institute of Special Education (KISE)",
    "KCA University",
    "Rift Valley Institute of Science and Technology (RVIST)",
    "Mount Kenya University (MKU)",
    "Michuki National Polytechnic",
    "Mully Children's Family (MCF)",
    "Mully College",
    "Kabete National Polytechnic",
    "Kenya Aeronautical College",
    "Dedan Kimathi University of Technology (DeKUT)",
    "Zetech University",
    "The Co-operative University of Kenya",
    "Thika Technical Training Institute",
    "Africa Nazarene University",
    "Moi University",
    "Institute of Certified Secretaries (ICS)",
    "Maseno University",
    "Kenya Medical Training College (KMTC) – Makueni Campus",
    "Ngong Technical and Vocational College",
    "Nairobi Institute of Business Studies (NIBS)",
    "Kiriri Women's University of Science and Technology",
    "East African Civil Aviation Academy (EACAA)",
    "The East African University",
    "Kenya School of Law (KSL)",
    "Amani Counselling Centre and Training Institute (ACCTI)",
    "Nairobi Institute of Technology (NIT)",
    "Kenya College of Interior Design (KENCID)",
    "Mount Kenya University – Parklands Law Campus",
    "Catholic University of Eastern Africa (CUEA)",
    "Machakos University",
    "Pan Africa Christian University (PAC University)",
    "Boma International Hospitality College",
    "Management University of Africa (MUA)",
    "Egerton University",
    "Kabarak University",
]

UNSPECIFIED = "Unspecified"
_ACRONYM = re.compile(r"\(([^)]+)\)\s*$")
_SPACES = re.compile(r"\s+")


@dataclass(frozen=True)
class Institution:
    name: str     # full display value stored on the saint, e.g. "University of Nairobi (UoN) – Chiromo Campus"
    base: str     # name without campus, e.g. "University of Nairobi (UoN)"
    code: str     # tally code, e.g. "UoN"; the full base name when there is no acronym
    campus: str | None  # e.g. "Chiromo Campus"; used to prefill Institution Location


def _clean(value: str) -> str:
    return _SPACES.sub(" ", value).strip()


def _fold(value: str) -> str:
    return _clean(value).casefold().replace("–", "-").replace("—", "-")


def _parse(raw: str) -> Institution:
    base, _, campus = raw.partition(" – ")
    base = base.strip()
    m = _ACRONYM.search(base)
    code = m.group(1) if m else base
    return Institution(name=raw, base=base, code=code, campus=campus.strip() or None)


def _with_shared_codes(items: list[Institution]) -> list[Institution]:
    """A campus listed without the acronym ("Mount Kenya University – Parklands Law
    Campus") must tally with the entry that has it ("Mount Kenya University (MKU)")."""
    acronym_of = {}
    for i in items:
        m = _ACRONYM.search(i.base)
        if m:
            acronym_of[_clean(i.base[: m.start()]).casefold()] = m.group(1)
    return [
        i if _ACRONYM.search(i.base) or _fold(i.base) not in acronym_of
        else Institution(i.name, i.base, acronym_of[_fold(i.base)], i.campus)
        for i in items
    ]


INSTITUTIONS: list[Institution] = _with_shared_codes([_parse(r) for r in RAW_INSTITUTIONS])

_BY_FULL = {_fold(i.name): i for i in INSTITUTIONS}
# base / acronym lookups resolve to the first entry carrying that base (campus-less form preferred)
_BY_BASE: dict[str, Institution] = {}
for _i in INSTITUTIONS:
    for _k in (_fold(_i.base), _fold(_i.code)):
        _BY_BASE.setdefault(_k, _i)


def match(value: str | None) -> Institution | None:
    """Return the listed institution a free-text value refers to, or None."""
    if not value or not value.strip():
        return None
    key = _fold(value)
    return _BY_FULL.get(key) or _BY_BASE.get(key)


def canonical_name(value: str | None) -> str | None:
    """Normalize an institution value for storage.

    Exact full match -> the listed full name (fixes casing/dash style).
    Base name or acronym only ("uon", "SEKU") -> the listed base name.
    Anything else is kept as typed (whitespace collapsed): students at an unlisted
    institution must still be able to register.
    """
    if value is None or not value.strip():
        return None
    key = _fold(value)
    if key in _BY_FULL:
        return _BY_FULL[key].name
    hit = _BY_BASE.get(key)
    if hit:
        return hit.base
    return _clean(value)


def tally_key(value: str | None) -> tuple[str, str]:
    """(group id, label) used to bucket a stored institution value in the tally."""
    if value is None or not value.strip():
        return UNSPECIFIED.casefold(), UNSPECIFIED
    hit = match(value)
    if hit:
        return hit.code.casefold(), hit.code
    text = _clean(value)
    return text.casefold(), text
