"""Pure report aggregation. No DB, no I/O: rows in, plain dicts out.

Everything the weekly / monthly / quarterly PDFs show is computed here so it can
be unit tested and checked against the sample deck (prep.pdf) in an eval.
"""

from __future__ import annotations

import calendar
import re
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Iterable

SERVICE_TYPES = ("thursday", "sunday")
WEEKDAY_OF = {"thursday": 3, "sunday": 6}
MONTH_NAMES = [calendar.month_name[i] for i in range(1, 13)]


@dataclass(frozen=True)
class ReportRow:
    center: str
    center_kind: str  # "residential" | "institution"
    is_main: bool
    service_date: date
    service_type: str
    service_number: int
    male: int
    female: int
    children: int
    serving_team: int
    first_timers: int
    new_converts: int
    venue: str = ""
    order: int = 0  # center display order (Center.sort_order)

    @property
    def attendance(self) -> int:
        return self.male + self.female + self.children


@dataclass(frozen=True)
class Period:
    kind: str  # "month" | "quarter"
    start: date
    end: date
    label: str  # "September 2026" / "Q3 2026"

    def previous(self) -> "Period":
        if self.kind == "month":
            return month_period(*_shift_month(self.start.year, self.start.month, -1))
        year, q = self.start.year, (self.start.month - 1) // 3 + 1
        q -= 1
        if q == 0:
            year, q = year - 1, 4
        return quarter_period(year, q)


def _shift_month(year: int, month: int, delta: int) -> tuple[int, int]:
    idx = year * 12 + (month - 1) + delta
    return idx // 12, idx % 12 + 1


def month_period(year: int, month: int) -> Period:
    last = calendar.monthrange(year, month)[1]
    return Period("month", date(year, month, 1), date(year, month, last), f"{MONTH_NAMES[month - 1]} {year}")


def quarter_period(year: int, quarter: int) -> Period:
    if quarter not in (1, 2, 3, 4):
        raise ValueError("quarter must be 1-4")
    first = (quarter - 1) * 3 + 1
    last_day = calendar.monthrange(year, first + 2)[1]
    return Period("quarter", date(year, first, 1), date(year, first + 2, last_day), f"Q{quarter} {year}")


def parse_month(value: str) -> Period:
    m = re.fullmatch(r"(\d{4})-(0[1-9]|1[0-2])", value)
    if not m:
        raise ValueError("month must look like 2026-09")
    return month_period(int(m[1]), int(m[2]))


def parse_quarter(value: str) -> Period:
    m = re.fullmatch(r"(\d{4})-Q([1-4])", value)
    if not m:
        raise ValueError("quarter must look like 2026-Q3")
    return quarter_period(int(m[1]), int(m[2]))


def week_start_of(d: date) -> date:
    """Monday of the week containing d."""
    return d - timedelta(days=d.weekday())


def count_weekday(start: date, end: date, weekday: int) -> int:
    if end < start:
        return 0
    days = (end - start).days + 1
    first_offset = (weekday - start.weekday()) % 7
    return 0 if first_offset >= days else (days - first_offset - 1) // 7 + 1


def _in(rows: Iterable[ReportRow], start: date, end: date) -> list[ReportRow]:
    return [r for r in rows if start <= r.service_date <= end]


def _mean(values: list[int]) -> float | None:
    return round(sum(values) / len(values), 1) if values else None


def _variance(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None:
        return None
    return round(current - previous, 1)


def attendance_by_date(rows: list[ReportRow]) -> dict[date, int]:
    """Total attendance per calendar date (several numbered services on one day add up)."""
    out: dict[date, int] = {}
    for r in rows:
        out[r.service_date] = out.get(r.service_date, 0) + r.attendance
    return out


def _avg_per_date(rows: list[ReportRow]) -> float | None:
    return _mean(list(attendance_by_date(rows).values()))


# ---------------------------------------------------------------- weekly


def weekly_report(rows: list[ReportRow], week_start: date) -> dict:
    """One block per service in the Monday-Sunday week, headed by service number."""
    week_start = week_start_of(week_start)
    week_end = week_start + timedelta(days=6)
    in_week = sorted(
        _in(rows, week_start, week_end),
        key=lambda r: (r.service_date, r.service_number, r.center),
    )
    services = []
    for r in in_week:
        services.append(
            {
                "heading": f"Service {r.service_number}",
                "center": r.center,
                "service_date": r.service_date.isoformat(),
                "service_type": r.service_type,
                "service_number": r.service_number,
                "venue": r.venue,
                "male": r.male,
                "female": r.female,
                "children": r.children,
                "total_attendance": r.attendance,
                "serving_team": r.serving_team,
                "first_timers": r.first_timers,
                "new_converts": r.new_converts,
            }
        )
    totals = {
        k: sum(s[k] for s in services)
        for k in ("male", "female", "children", "total_attendance", "serving_team", "first_timers", "new_converts")
    }
    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "services": services,
        "totals": totals,
    }


# ---------------------------------------------------------------- monthly / quarterly


def _center_order(rows: list[ReportRow]) -> list[tuple[str, str, bool]]:
    """(name, kind, is_main) for centers present: main first, then Center.sort_order, then name."""
    seen = {(r.center, r.center_kind, r.is_main, r.order) for r in rows}
    return [(n, k, m) for n, k, m, _ in sorted(seen, key=lambda c: (not c[2], c[3], c[0]))]


def _trend(main_rows: list[ReportRow], period: Period, prev_rows: list[ReportRow]) -> dict:
    """Main-center trend per service type.

    Month: x = "Avg. <prev month>", then nth occurrence of the weekday (1..5).
    Quarter: x = "Avg. <prev quarter>", then each month of the quarter.
    """
    prev_label = period.previous().label
    out: dict = {"labels": [f"Avg. {prev_label}"], "series": {}, "peaks": {}}
    if period.kind == "month":
        n_points = max(count_weekday(period.start, period.end, w) for w in WEEKDAY_OF.values())
        out["labels"] += [str(i) for i in range(1, n_points + 1)]
    else:
        out["labels"] += [MONTH_NAMES[(period.start.month - 1 + i)][:3] for i in range(3)]

    for stype, weekday in WEEKDAY_OF.items():
        cur = [r for r in main_rows if r.service_type == stype]
        points: list[float | None] = [_avg_per_date([r for r in prev_rows if r.service_type == stype])]
        peak: dict | None = None
        if period.kind == "month":
            by_date = attendance_by_date(cur)
            for i in range(1, len(out["labels"])):
                match = [d for d in by_date if (d.day - 1) // 7 + 1 == i]
                points.append(float(by_date[match[0]]) if match else None)
                if match and (peak is None or by_date[match[0]] > peak["value"]):
                    peak = {"label": str(i), "value": by_date[match[0]], "date": match[0].isoformat()}
        else:
            for i in range(3):
                month_no = period.start.month + i
                month_rows = [r for r in cur if r.service_date.month == month_no]
                avg = _avg_per_date(month_rows)
                points.append(avg)
                if avg is not None and (peak is None or avg > peak["value"]):
                    peak = {"label": out["labels"][i + 1], "value": avg, "date": None}
        out["series"][stype] = points
        out["peaks"][stype] = peak
    return out


def _month_history(main_rows_all: list[ReportRow], upto: date) -> list[dict]:
    totals: dict[tuple[int, int], int] = {}
    for r in main_rows_all:
        if r.service_date <= upto:
            key = (r.service_date.year, r.service_date.month)
            totals[key] = totals.get(key, 0) + r.attendance
    return [
        {"month": f"{y}-{m:02d}", "label": f"{MONTH_NAMES[m - 1][:3]} {y}", "attendance": totals[(y, m)]}
        for (y, m) in sorted(totals)
    ]


def period_report(rows: list[ReportRow], period: Period, as_of: date | None = None) -> dict:
    """Monthly / quarterly analysis. `rows` must cover this period and the previous one,
    and (for the history slide) may reach further back."""
    as_of = as_of or date.today()
    effective_end = min(period.end, as_of)
    prev = period.previous()

    cur_rows = _in(rows, period.start, period.end)
    prev_rows = _in(rows, prev.start, prev.end)
    main_all = [r for r in rows if r.is_main]
    main_cur = [r for r in cur_rows if r.is_main]
    main_prev = [r for r in prev_rows if r.is_main]

    # Cover KPIs (sample p.1): converts, first timers, main-center Thursday / Sunday averages.
    kpis = {
        "new_converts": sum(r.new_converts for r in cur_rows),
        "first_timers": sum(r.first_timers for r in cur_rows),
        "thursday_attendance": _avg_per_date([r for r in main_cur if r.service_type == "thursday"]),
        "sunday_attendance": _avg_per_date([r for r in main_cur if r.service_type == "sunday"]),
    }

    centers = []
    for name, kind, is_main in _center_order(cur_rows + prev_rows):
        c_cur = [r for r in cur_rows if r.center == name]
        c_prev = [r for r in prev_rows if r.center == name]
        entry: dict = {
            "center": name,
            "kind": kind,
            "is_main": is_main,
            "first_timers": sum(r.first_timers for r in c_cur),
            "serving_team": sum(r.serving_team for r in c_cur),
            "new_converts": sum(r.new_converts for r in c_cur),
            "male": sum(r.male for r in c_cur),
            "female": sum(r.female for r in c_cur),
            "children": sum(r.children for r in c_cur),
        }
        for stype, weekday in WEEKDAY_OF.items():
            cur_t = [r for r in c_cur if r.service_type == stype]
            prev_t = [r for r in c_prev if r.service_type == stype]
            avg, prev_avg = _avg_per_date(cur_t), _avg_per_date(prev_t)
            # A report with zero attendance means no service happened (e.g. no livestream), not a held one.
            held = sum(1 for v in attendance_by_date(cur_t).values() if v > 0)
            expected = count_weekday(period.start, effective_end, weekday)
            entry[stype] = {
                "average": avg,
                "previous_average": prev_avg,
                "variance": _variance(avg, prev_avg),
                "frequency": held,
                "expected": expected,
                "percent": round(100 * held / expected) if expected else 0,
            }
        centers.append(entry)

    history = _month_history(main_all, period.end)
    return {
        "period": {
            "kind": period.kind,
            "label": period.label,
            "start": period.start.isoformat(),
            "end": period.end.isoformat(),
            "previous_label": prev.label,
        },
        "kpis": kpis,
        "main_center": next((c["center"] for c in centers if c["is_main"]), None),
        "trend": _trend(main_cur, period, main_prev),
        "centers": centers,
        "history": history if len(history) >= 2 else [],
        "service_count": len(cur_rows),
        "has_data": bool(cur_rows),
    }
