import pytest


@pytest.fixture
def event_payload():
    return {
        "first_name": "John",
        "last_name": "Doe",
        "gender": True,
        "phone_number": "+256700000001",
        "student": False,
        "institution_or_profession": "Engineer",
        "first_time": True,
        "consent": True,
    }


async def test_event_register_happy_path_returns_201(client, event_payload):
    resp = await client.post("/saints/event-register", json=event_payload)
    assert resp.status_code == 201


async def test_event_register_response_contains_id_and_timestamps(client, event_payload):
    resp = await client.post("/saints/event-register", json=event_payload)
    data = resp.json()
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


async def test_event_register_normalizes_name_to_title_case(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "  jOHN  ",
        "last_name": "  DOE  ",
        "gender": True,
        "phone_number": "+256700000002",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"


async def test_event_register_phone_stored(client, event_payload):
    resp = await client.post("/saints/event-register", json=event_payload)
    data = resp.json()
    assert data["phone_number"] == "+256700000001"


async def test_event_register_institution_keyword_sets_student_and_university(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Alice",
        "last_name": "Wanjiku",
        "gender": False,
        "phone_number": "+256700000003",
        "student": False,
        "institution_or_profession": "University of Nairobi",
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is True
    assert data["university"] == "University Of Nairobi"
    assert data["occupation"] is None


async def test_event_register_profession_sets_occupation(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Bob",
        "last_name": "Kenyatta",
        "gender": True,
        "phone_number": "+256700000004",
        "student": False,
        "institution_or_profession": "Software Engineer",
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is False
    assert data["occupation"] == "Software Engineer"
    assert data["university"] is None


async def test_event_register_student_explicit_true_still_overridden_by_institution(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Carol",
        "last_name": "Otieno",
        "gender": False,
        "phone_number": "+256700000005",
        "student": True,
        "institution_or_profession": "Strathmore College",
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is True
    assert "College" in data["university"]


async def test_event_register_first_time_flag_stored(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Carol",
        "last_name": "Otieno",
        "gender": False,
        "phone_number": "+256700000005",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    assert resp.json()["first_time"] is True


async def test_event_register_consent_sets_both_consent_fields(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "David",
        "last_name": "Mwangi",
        "gender": True,
        "phone_number": "+256700000006",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["consent_to_share_info"] is True
    assert data["whatsApp_group_consent"] is True


async def test_event_register_consent_false_sets_both_false(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Eve",
        "last_name": "Kamau",
        "gender": False,
        "phone_number": "+256700000007",
        "student": False,
        "first_time": False,
        "consent": False,
    })
    data = resp.json()
    assert data["consent_to_share_info"] is False
    assert data["whatsApp_group_consent"] is False


async def test_event_register_auto_checkin_creates_attendance(client, event_payload, auth_super):
    resp = await client.post("/saints/event-register", json=event_payload)
    saint_id = resp.json()["id"]

    check_resp = await client.get(f"/saints/{saint_id}", headers=auth_super)
    assert check_resp.status_code == 200
    stats = check_resp.json()
    assert stats["attendance_count"] >= 1


async def test_event_register_existing_saint_found_by_exact_name_updates_and_returns_201(client, event_payload):
    first = await client.post("/saints/event-register", json=event_payload)
    saint_id = first.json()["id"]

    event_payload["phone_number"] = "+256999999999"
    second = await client.post("/saints/event-register", json=event_payload)
    assert second.status_code == 201
    assert second.json()["id"] == saint_id


async def test_event_register_existing_saint_found_by_swapped_name(client, event_payload):
    await client.post("/saints/event-register", json=event_payload)

    swapped = {
        "first_name": "Doe",
        "last_name": "John",
        "gender": True,
        "phone_number": "+256999999999",
        "student": False,
        "first_time": True,
        "consent": True,
    }
    resp = await client.post("/saints/event-register", json=swapped)
    assert resp.status_code == 201


async def test_event_register_existing_saint_phone_updated(client):
    await client.post("/saints/event-register", json={
        "first_name": "Grace",
        "last_name": "Akinyi",
        "gender": False,
        "phone_number": "+256700000008",
        "student": False,
        "first_time": True,
        "consent": True,
    })

    resp = await client.post("/saints/event-register", json={
        "first_name": "Grace",
        "last_name": "Akinyi",
        "gender": False,
        "phone_number": "+256700000009",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["phone_number"] == "+256700000009"


async def test_event_register_existing_saint_consent_updated(client):
    await client.post("/saints/event-register", json={
        "first_name": "Henry",
        "last_name": "Kiplagat",
        "gender": True,
        "phone_number": "+256700000009",
        "student": False,
        "first_time": True,
        "consent": False,
    })

    resp = await client.post("/saints/event-register", json={
        "first_name": "Henry",
        "last_name": "Kiplagat",
        "gender": True,
        "phone_number": "+256700000009",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["consent_to_share_info"] is True
    assert data["whatsApp_group_consent"] is True


async def test_event_register_missing_first_name_returns_422(client):
    resp = await client.post("/saints/event-register", json={
        "last_name": "User",
        "gender": True,
        "phone_number": "+256700000010",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    assert resp.status_code == 422


async def test_event_register_missing_last_name_returns_422(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Test",
        "gender": True,
        "phone_number": "+256700000011",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    assert resp.status_code == 422


async def test_event_register_missing_gender_returns_422(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "+256700000012",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    assert resp.status_code == 422


async def test_event_register_missing_first_time_returns_422(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Test",
        "last_name": "User",
        "gender": True,
        "phone_number": "+256700000013",
        "student": False,
        "consent": True,
    })
    assert resp.status_code == 422


async def test_event_register_missing_consent_returns_422(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Test",
        "last_name": "User",
        "gender": True,
        "phone_number": "+256700000014",
        "student": False,
        "first_time": True,
    })
    assert resp.status_code == 422


async def test_event_register_duplicate_phone_via_register_found_by_contact(client):
    await client.post("/saints/register", json={
        "first_name": "Existing",
        "last_name": "User",
        "gender": True,
        "student": False,
        "first_time": False,
        "whatsApp_group_consent": False,
        "consent_to_share_info": False,
        "phone_number": "+256700000015",
    })
    resp = await client.post("/saints/event-register", json={
        "first_name": "New",
        "last_name": "Person",
        "gender": True,
        "phone_number": "+256700000015",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    assert resp.status_code == 201


async def test_register_happy_path_unchanged(client, saint_payload):
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 201


async def test_register_duplicate_email_still_409(client, saint_payload):
    await client.post("/saints/register", json=saint_payload)
    saint_payload["phone_number"] = "+256700000099"
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 409


async def test_event_register_college_keyword_sets_student(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Ian",
        "last_name": "Mwangi",
        "gender": True,
        "phone_number": "+256700000017",
        "student": False,
        "institution_or_profession": "Strathmore College",
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is True
    assert "College" in data["university"]


async def test_event_register_school_keyword_sets_student(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Jane",
        "last_name": "Wanjeri",
        "gender": False,
        "phone_number": "+256700000018",
        "student": False,
        "institution_or_profession": "Moi High School",
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is True


async def test_event_register_student_false_without_institution_keeps_false(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Peter",
        "last_name": "Kamau",
        "gender": True,
        "phone_number": "+256700000019",
        "student": False,
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is False
    assert data["occupation"] is None
    assert data["university"] is None


async def test_event_register_student_true_without_institution_keeps_true(client):
    resp = await client.post("/saints/event-register", json={
        "first_name": "Mary",
        "last_name": "Wambui",
        "gender": False,
        "phone_number": "+256700000020",
        "student": True,
        "first_time": True,
        "consent": True,
    })
    data = resp.json()
    assert data["student"] is True
    assert data["occupation"] is None
    assert data["university"] is None
