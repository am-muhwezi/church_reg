from datetime import date, timedelta
from typing import Literal

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.attendance import Attendance
from src.db.models.saints import Saint
from src.schemas.admin import (
    AdminStats,
    AttendanceDetail,
    AttendanceLogEntry,
    AttendanceTrend,
    DateRangeReport,
    NewTodaySaint,
    ReportData,
)


async def get_admin_stats(db: AsyncSession) -> AdminStats:
    today = date.today()
    first_of_month = today.replace(day=1)

    total = await db.scalar(select(func.count()).select_from(Saint)) or 0

    today_checkins = await db.scalar(
        select(func.count())
        .select_from(Attendance)
        .where(Attendance.service_date == today)
    ) or 0

    this_month = await db.scalar(
        select(func.count(func.distinct(Attendance.saint_id)))
        .select_from(Attendance)
        .where(Attendance.service_date >= first_of_month)
    ) or 0

    per_service = await db.execute(
        select(func.count().label("count"))
        .select_from(Attendance)
        .group_by(Attendance.service_date)
    )
    counts = [r.count for r in per_service.all()]
    avg_attendance = round(sum(counts) / len(counts), 1) if counts else 0.0

    trend_rows = await db.execute(
        select(Attendance.service_date, func.count().label("count"))
        .group_by(Attendance.service_date)
        .order_by(Attendance.service_date.desc())
        .limit(8)
    )
    attendance_trend = [
        AttendanceTrend(date=r.service_date, count=r.count)
        for r in trend_rows.all()
    ]

    new_today_rows = await db.execute(
        select(Saint)
        .join(Attendance, Saint.id == Attendance.saint_id)
        .where(
            and_(
                Attendance.service_date == today,
                Saint.first_time == True,  # noqa: E712
            )
        )
    )
    new_today = [
        NewTodaySaint(
            id=s.id,
            first_name=s.first_name,
            last_name=s.last_name,
            occupation=s.occupation,
            university=s.university,
            student=s.student,
        )
        for s in new_today_rows.scalars().all()
    ]

    return AdminStats(
        total_registered=total,
        today_checkins=today_checkins,
        this_month=this_month,
        avg_attendance=avg_attendance,
        attendance_trend=attendance_trend,
        new_today=new_today,
    )


async def get_report_data(
    db: AsyncSession,
    period: Literal["weekly", "monthly", "all"] | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ReportData:
    today = date.today()
    first_of_month = today.replace(day=1)

    if period is not None:
        if period == "weekly":
            start_date = today - timedelta(days=7)
            end_date = today
        elif period == "monthly":
            start_date = first_of_month
            end_date = today
        else:
            start_date = None
            end_date = None

    total = await db.scalar(select(func.count()).select_from(Saint)) or 0

    today_checkins = await db.scalar(
        select(func.count()).select_from(Attendance).where(Attendance.service_date == today)
    ) or 0

    this_month = await db.scalar(
        select(func.count(func.distinct(Attendance.saint_id)))
        .select_from(Attendance)
        .where(Attendance.service_date >= first_of_month)
    ) or 0

    whatsapp_count = await db.scalar(
        select(func.count()).select_from(Saint).where(Saint.whatsApp_group_consent == True)  # noqa: E712
    ) or 0

    male_count = await db.scalar(
        select(func.count()).select_from(Saint).where(Saint.gender == True)  # noqa: E712
    ) or 0

    student_count = await db.scalar(
        select(func.count()).select_from(Saint).where(Saint.student == True)  # noqa: E712
    ) or 0

    per_service = await db.execute(
        select(func.count().label("count"))
        .select_from(Attendance)
        .group_by(Attendance.service_date)
    )
    counts = [r.count for r in per_service.all()]
    avg_attendance = round(sum(counts) / len(counts), 1) if counts else 0.0

    first_time_date = start_date if start_date and (start_date == end_date or end_date is None) else today
    first_time_condition = [Attendance.service_date == first_time_date]
    if start_date and end_date and start_date != end_date:
        first_time_condition = [Attendance.service_date >= start_date, Attendance.service_date <= end_date]
    elif start_date:
        first_time_condition = [Attendance.service_date >= start_date]

    first_time_in_range = await db.scalar(
        select(func.count())
        .select_from(Saint)
        .join(Attendance, Saint.id == Attendance.saint_id)
        .where(and_(*first_time_condition, Saint.first_time == True))  # noqa: E712
    ) or 0

    log_query = (
        select(
            Attendance.service_date,
            func.count().label("count"),
            func.sum(case((Saint.first_time == True, 1), else_=0)).label("new_visitors"),  # noqa: E712
        )
        .join(Saint, Attendance.saint_id == Saint.id)
        .group_by(Attendance.service_date)
        .order_by(Attendance.service_date.desc())
    )

    if start_date is not None:
        log_query = log_query.where(Attendance.service_date >= start_date)
    if end_date is not None:
        log_query = log_query.where(Attendance.service_date <= end_date)

    log_rows = await db.execute(log_query)
    attendance_log = [
        AttendanceLogEntry(date=r.service_date, count=r.count, new_visitors=r.new_visitors or 0)
        for r in log_rows.all()
    ]

    return ReportData(
        total_registered=total,
        today_checkins=today_checkins,
        this_month=this_month,
        whatsapp_count=whatsapp_count,
        avg_attendance=avg_attendance,
        male_count=male_count,
        female_count=total - male_count,
        student_count=student_count,
        professional_count=total - student_count,
        first_time_today=first_time_in_range,
        attendance_log=attendance_log,
    )


async def get_attendance_details(
    db: AsyncSession,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[AttendanceDetail]:
    query = (
        select(
            Saint.id,
            Saint.first_name,
            Saint.last_name,
            Saint.email,
            Saint.phone_number,
            Saint.gender,
            Saint.student,
            Saint.occupation,
            Saint.residence,
            Saint.university,
            Saint.institution_location,
            Saint.first_time,
            Saint.whatsApp_group_consent,
            Attendance.service_date,
        )
        .join(Attendance, Saint.id == Attendance.saint_id)
        .order_by(Attendance.service_date.desc(), Saint.last_name, Saint.first_name)
    )

    if start_date is not None:
        query = query.where(Attendance.service_date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.service_date <= end_date)

    rows = await db.execute(query)
    return [
        AttendanceDetail(
            id=r.id,
            first_name=r.first_name,
            last_name=r.last_name,
            email=r.email,
            phone_number=r.phone_number,
            gender=r.gender,
            student=r.student,
            occupation=r.occupation,
            residence=r.residence,
            university=r.university,
            institution_location=r.institution_location,
            first_time=r.first_time,
            whatsApp_group_consent=r.whatsApp_group_consent,
            service_date=r.service_date,
        )
        for r in rows.all()
    ]


async def get_date_range_report(
    db: AsyncSession,
    start_date: date,
    end_date: date,
) -> DateRangeReport:
    summary = await get_report_data(db, start_date=start_date, end_date=end_date)
    details = await get_attendance_details(db, start_date=start_date, end_date=end_date)
    return DateRangeReport(summary=summary, attendance_details=details)
