from datetime import timedelta

from tests.conftest import FIXED_DATE_STR
from tests.factories import make_saint, make_attendance


# ── /admin/stats ───────────────────────────────────────────────────────────────

async def test_stats_no_auth_returns_401(client):
    resp = await client.get("/admin/stats")
    assert resp.status_code == 401


async def test_stats_empty_db_returns_zeros(client, auth_super):
    resp = await client.get("/admin/stats", headers=auth_super)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_registered"] == 0
    assert data["today_checkins"] == 0
    assert data["this_month"] == 0
    assert data["avg_attendance"] == 0.0
    assert data["attendance_trend"] == []
    assert data["new_today"] == []


async def test_stats_total_registered_counts_all_saints(client, auth_super, db_session):
    saints = [make_saint(first_name=f"Saint{i}", last_name="Test") for i in range(3)]
    for s in saints:
        db_session.add(s)
    await db_session.flush()

    resp = await client.get("/admin/stats", headers=auth_super)
    assert resp.json()["total_registered"] == 3


async def test_stats_today_checkins(client, auth_super, db_session, fixed_today):
    s1 = make_saint(first_name="A", last_name="One")
    s2 = make_saint(first_name="B", last_name="Two")
    db_session.add(s1)
    db_session.add(s2)
    await db_session.flush()
    db_session.add(make_attendance(s1.id, fixed_today))
    db_session.add(make_attendance(s2.id, fixed_today))
    await db_session.flush()

    resp = await client.get("/admin/stats", headers=auth_super)
    assert resp.json()["today_checkins"] == 2


async def test_stats_this_month_counts_distinct_saints(client, auth_super, db_session, fixed_today):
    saint = make_saint(first_name="Repeat", last_name="Attender")
    db_session.add(saint)
    await db_session.flush()
    # Same saint checked in on 3 different days this month
    for day in [1, 3, 5]:
        db_session.add(make_attendance(saint.id, fixed_today.replace(day=day)))
    await db_session.flush()

    resp = await client.get("/admin/stats", headers=auth_super)
    assert resp.json()["this_month"] == 1


async def test_stats_avg_attendance_correct(client, auth_super, db_session, fixed_today):
    # 4 saints attend on day 1, 2 saints attend on day 2
    saints = [make_saint(first_name=f"Avg{i}", last_name="Test") for i in range(4)]
    for s in saints:
        db_session.add(s)
    await db_session.flush()

    day1 = fixed_today.replace(day=2)
    day2 = fixed_today.replace(day=3)
    for s in saints:
        db_session.add(make_attendance(s.id, day1))
    for s in saints[:2]:
        db_session.add(make_attendance(s.id, day2))
    await db_session.flush()

    resp = await client.get("/admin/stats", headers=auth_super)
    assert resp.json()["avg_attendance"] == 3.0  # (4+2)/2


async def test_stats_trend_returns_at_most_8_service_dates(client, auth_super, db_session, fixed_today):
    saints = [make_saint(first_name=f"T{i}", last_name="X") for i in range(10)]
    for s in saints:
        db_session.add(s)
    await db_session.flush()
    for i, s in enumerate(saints):
        db_session.add(make_attendance(s.id, fixed_today - timedelta(days=i)))
    await db_session.flush()

    resp = await client.get("/admin/stats", headers=auth_super)
    assert len(resp.json()["attendance_trend"]) == 8


async def test_stats_new_today_excludes_returning_visitors(client, auth_super, db_session, fixed_today):
    first_timer = make_saint(first_name="First", last_name="Timer")
    returning = make_saint(first_name="Returning", last_name="Member")
    db_session.add(first_timer)
    db_session.add(returning)
    await db_session.flush()
    db_session.add(make_attendance(returning.id, fixed_today - timedelta(days=14)))
    db_session.add(make_attendance(first_timer.id, fixed_today))
    db_session.add(make_attendance(returning.id, fixed_today))
    await db_session.flush()

    resp = await client.get("/admin/stats", headers=auth_super)
    new_today = resp.json()["new_today"]
    assert len(new_today) == 1
    assert new_today[0]["first_name"] == "First"


# ── /admin/report ──────────────────────────────────────────────────────────────

async def test_report_no_auth_returns_401(client):
    resp = await client.get("/admin/report")
    assert resp.status_code == 401


async def test_report_default_period_returns_all_data(client, auth_super, db_session, fixed_today):
    s = make_saint(first_name="R", last_name="D")
    db_session.add(s)
    await db_session.flush()
    for delta in [20, 2]:
        db_session.add(make_attendance(s.id, fixed_today - timedelta(days=delta)))
    await db_session.flush()

    resp = await client.get("/admin/report", headers=auth_super)
    assert resp.status_code == 200
    assert len(resp.json()["attendance_log"]) == 2


async def test_report_period_all_includes_all_dates(client, auth_super, db_session, fixed_today):
    s = make_saint(first_name="All", last_name="Time")
    db_session.add(s)
    await db_session.flush()
    for delta in [0, 10, 50]:
        db_session.add(make_attendance(s.id, fixed_today - timedelta(days=delta)))
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "all"}, headers=auth_super)
    assert len(resp.json()["attendance_log"]) == 3


async def test_report_period_weekly_excludes_old_dates(client, auth_super, db_session, fixed_today):
    s = make_saint(first_name="W", last_name="Test")
    db_session.add(s)
    await db_session.flush()
    db_session.add(make_attendance(s.id, fixed_today - timedelta(days=10)))  # outside window
    db_session.add(make_attendance(s.id, fixed_today - timedelta(days=3)))   # inside window
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "weekly"}, headers=auth_super)
    assert len(resp.json()["attendance_log"]) == 1


async def test_report_period_monthly_excludes_prev_month(client, auth_super, db_session, fixed_today):
    s = make_saint(first_name="M", last_name="Test")
    db_session.add(s)
    await db_session.flush()
    # fixed_today is 2026-01-05; previous month = 2025-12-xx
    prev_month = fixed_today.replace(day=1) - timedelta(days=1)
    db_session.add(make_attendance(s.id, prev_month))          # outside
    db_session.add(make_attendance(s.id, fixed_today))         # inside
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "monthly"}, headers=auth_super)
    assert len(resp.json()["attendance_log"]) == 1


async def test_report_invalid_period_returns_422(client, auth_super):
    resp = await client.get("/admin/report", params={"period": "quarterly"}, headers=auth_super)
    assert resp.status_code == 422


async def test_report_whatsapp_count_correct(client, auth_super, db_session):
    db_session.add(make_saint(first_name="W1", last_name="X", whatsApp_group_consent=True))
    db_session.add(make_saint(first_name="W2", last_name="X", whatsApp_group_consent=True))
    db_session.add(make_saint(first_name="W3", last_name="X", whatsApp_group_consent=False))
    await db_session.flush()

    resp = await client.get("/admin/report", headers=auth_super)
    assert resp.json()["whatsapp_count"] == 2


async def test_report_gender_counts_correct(client, auth_super, db_session):
    for i in range(3):
        db_session.add(make_saint(first_name=f"M{i}", last_name="X", gender=True))
    for i in range(2):
        db_session.add(make_saint(first_name=f"F{i}", last_name="X", gender=False))
    await db_session.flush()

    resp = await client.get("/admin/report", headers=auth_super)
    data = resp.json()
    assert data["male_count"] == 3
    assert data["female_count"] == 2


async def test_report_student_professional_counts(client, auth_super, db_session):
    for i in range(2):
        db_session.add(make_saint(first_name=f"S{i}", last_name="X", student=True))
    for i in range(3):
        db_session.add(make_saint(first_name=f"P{i}", last_name="X", student=False))
    await db_session.flush()

    resp = await client.get("/admin/report", headers=auth_super)
    data = resp.json()
    assert data["student_count"] == 2
    assert data["professional_count"] == 3


async def test_report_attendance_log_new_visitors_column(client, auth_super, db_session, fixed_today):
    s1 = make_saint(first_name="N1", last_name="X")
    s2 = make_saint(first_name="N2", last_name="X")
    s3 = make_saint(first_name="N3", last_name="X")
    for s in (s1, s2, s3):
        db_session.add(s)
    await db_session.flush()
    # s3 attended last week, so today is NOT their first visit
    db_session.add(make_attendance(s3.id, fixed_today - timedelta(days=7)))
    for s in (s1, s2, s3):
        db_session.add(make_attendance(s.id, fixed_today))
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "all"}, headers=auth_super)
    log = resp.json()["attendance_log"]
    by_date = {entry["date"]: entry for entry in log}
    today_entry = by_date[str(fixed_today)]
    assert today_entry["count"] == 3
    assert today_entry["new_visitors"] == 2


async def test_report_first_time_requires_first_visit_in_period(client, auth_super, db_session, fixed_today):
    # First visit 40 days ago (outside the month), second visit this month.
    # The stale first_time flag must NOT count them as a first timer this month.
    returning = make_saint(first_name="Returning", last_name="Visitor", first_time=True)
    db_session.add(returning)
    await db_session.flush()
    db_session.add(make_attendance(returning.id, fixed_today - timedelta(days=40)))
    db_session.add(make_attendance(returning.id, fixed_today))
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "monthly"}, headers=auth_super)
    assert resp.json()["first_time_today"] == 0


async def test_report_first_time_counts_first_visit_in_period(client, auth_super, db_session, fixed_today):
    brand_new = make_saint(first_name="Brand", last_name="New", first_time=True)
    db_session.add(brand_new)
    await db_session.flush()
    db_session.add(make_attendance(brand_new.id, fixed_today))
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "monthly"}, headers=auth_super)
    assert resp.json()["first_time_today"] == 1


async def test_report_first_time_ignores_stale_flag(client, auth_super, db_session, fixed_today):
    # Two saints declared first_time at registration but first visited last month.
    # The flag must not count them: reports are driven by first-visit date, not the flag.
    stale1 = make_saint(first_name="Stale", last_name="One", first_time=True)
    stale2 = make_saint(first_name="Stale", last_name="Two", first_time=True)
    # fresh never declared first_time but today IS their first-ever visit.
    fresh = make_saint(first_name="Fresh", last_name="Face", first_time=False)
    db_session.add(stale1)
    db_session.add(stale2)
    db_session.add(fresh)
    await db_session.flush()
    db_session.add(make_attendance(stale1.id, fixed_today - timedelta(days=40)))
    db_session.add(make_attendance(stale2.id, fixed_today - timedelta(days=40)))
    db_session.add(make_attendance(stale1.id, fixed_today))
    db_session.add(make_attendance(stale2.id, fixed_today))
    db_session.add(make_attendance(fresh.id, fixed_today))
    await db_session.flush()

    resp = await client.get("/admin/report", params={"period": "monthly"}, headers=auth_super)
    assert resp.json()["first_time_today"] == 1  # only Fresh Face first-timed this month


async def test_report_total_and_gender_sum_matches(client, auth_super, db_session):
    for i in range(4):
        db_session.add(make_saint(first_name=f"X{i}", last_name="Y", gender=i % 2 == 0))
    await db_session.flush()

    resp = await client.get("/admin/report", headers=auth_super)
    data = resp.json()
    assert data["male_count"] + data["female_count"] == data["total_registered"]
