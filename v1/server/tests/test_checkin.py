import uuid

from tests.factories import make_saint


async def test_checkin_creates_attendance_for_new_checkin(client, registered_saint, fixed_today):
    resp = await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["already_checked_in"] is False
    assert data["action"] == "confirmed"


async def test_checkin_returns_correct_service_date(client, registered_saint, fixed_today):
    resp = await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    data = resp.json()
    assert data["service_date"] == str(fixed_today)
    assert data["action"] == "confirmed"


async def test_checkin_no_auth_required(client, registered_saint, fixed_today):
    resp = await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    assert resp.status_code == 200


async def test_checkin_with_custom_action(client, registered_saint, fixed_today):
    resp = await client.post("/saints/checkin", json={"saint_id": registered_saint["id"], "action": "new_registration"})
    assert resp.status_code == 200
    assert resp.json()["action"] == "new_registration"


async def test_checkin_idempotent_second_call_returns_true(client, registered_saint, fixed_today):
    await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    resp = await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    assert resp.json()["already_checked_in"] is True


async def test_checkin_idempotent_service_date_unchanged(client, registered_saint, fixed_today):
    await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    resp = await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    assert resp.json()["service_date"] == str(fixed_today)


async def test_checkin_invalid_uuid_returns_422(client):
    resp = await client.post("/saints/checkin", json={"saint_id": "not-a-uuid"})
    assert resp.status_code == 422


async def test_checkin_nonexistent_saint_id_returns_404(client, fixed_today):
    random_id = str(uuid.uuid4())
    resp = await client.post("/saints/checkin", json={"saint_id": random_id})
    assert resp.status_code == 404


async def test_checkin_never_clears_first_time_flag(client, db_session, monkeypatch):
    from datetime import date

    import src.services.checkin_service as checkin_mod
    from src.db.models.saints import Saint

    saint = make_saint(first_name="First", last_name="Timer", first_time=True)
    db_session.add(saint)
    await db_session.flush()
    saint_id = str(saint.id)

    class _SeqDate(date):
        current = date(2026, 1, 5)

        @classmethod
        def today(cls):
            return cls.current

    monkeypatch.setattr(checkin_mod, "date", _SeqDate)

    await client.post("/saints/checkin", json={"saint_id": saint_id})
    _SeqDate.current = date(2026, 1, 6)
    await client.post("/saints/checkin", json={"saint_id": saint_id})

    refreshed = await db_session.get(Saint, saint.id)
    assert refreshed.first_time is True
