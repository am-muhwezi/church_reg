from datetime import date, timedelta
from typing import Literal

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.attendance import Attendance
from src.db.models.saints import Saint
from src.schemas.admin import (
    AdminStats,
    AttendanceLogEntry,
    AttendanceTrend,
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
    db: AsyncSession, period: Literal["weekly", "monthly", "all"]
) -> ReportData:
    today = date.today()
    first_of_month = today.replace(day=1)

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

    first_time_today = await db.scalar(
        select(func.count())
        .select_from(Saint)
        .join(Attendance, Saint.id == Attendance.saint_id)
        .where(and_(Attendance.service_date == today, Saint.first_time == True))  # noqa: E712
    ) or 0

    # Period filter for attendance log
    if period == "weekly":
        since = today - timedelta(days=7)
    elif period == "monthly":
        since = first_of_month
    else:
        since = None

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
    if since is not None:
        log_query = log_query.where(Attendance.service_date >= since)

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
        first_time_today=first_time_today,
        attendance_log=attendance_log,
    )
