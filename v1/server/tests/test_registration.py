import pytest


async def test_register_happy_path_returns_201(client, saint_payload):
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 201


async def test_register_response_contains_id_and_timestamps(client, saint_payload):
    resp = await client.post("/saints/register", json=saint_payload)
    data = resp.json()
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


async def test_register_normalizes_first_name_to_title_case(client, saint_payload):
    saint_payload["first_name"] = "  jOHN  "
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.json()["first_name"] == "John"


async def test_register_normalizes_last_name_to_title_case(client, saint_payload):
    saint_payload["last_name"] = "DOE smith"
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.json()["last_name"] == "Doe Smith"


async def test_register_duplicate_email_returns_409(client, saint_payload):
    await client.post("/saints/register", json=saint_payload)
    saint_payload["phone_number"] = "+256700000099"
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 409


async def test_register_duplicate_email_returns_existing_saint_data(client, saint_payload):
    first = await client.post("/saints/register", json=saint_payload)
    saint_payload["phone_number"] = "+256700000099"
    resp = await client.post("/saints/register", json=saint_payload)
    body = resp.json()
    assert "saint" in body
    assert body["saint"]["id"] == first.json()["id"]


async def test_register_duplicate_email_detail_mentions_email(client, saint_payload):
    await client.post("/saints/register", json=saint_payload)
    saint_payload["phone_number"] = "+256700000099"
    resp = await client.post("/saints/register", json=saint_payload)
    assert "email" in resp.json()["detail"].lower()


async def test_register_duplicate_phone_returns_409(client, saint_payload):
    await client.post("/saints/register", json=saint_payload)
    saint_payload["email"] = "other@example.com"
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 409


async def test_register_duplicate_phone_detail_mentions_phone(client, saint_payload):
    await client.post("/saints/register", json=saint_payload)
    saint_payload["email"] = "other@example.com"
    resp = await client.post("/saints/register", json=saint_payload)
    assert "phone" in resp.json()["detail"].lower()


async def test_register_missing_first_name_returns_422(client, saint_payload):
    del saint_payload["first_name"]
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 422


async def test_register_missing_last_name_returns_422(client, saint_payload):
    del saint_payload["last_name"]
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 422


async def test_register_missing_gender_returns_422(client, saint_payload):
    del saint_payload["gender"]
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 422


async def test_register_missing_student_returns_422(client, saint_payload):
    del saint_payload["student"]
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 422


async def test_register_null_email_and_phone_accepted(client, saint_payload):
    saint_payload["email"] = None
    saint_payload["phone_number"] = None
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.status_code == 201


async def test_register_two_saints_with_null_email_both_succeed(client, saint_payload):
    saint_payload["email"] = None
    saint_payload["phone_number"] = None
    r1 = await client.post("/saints/register", json=saint_payload)
    saint_payload["first_name"] = "Jane"
    r2 = await client.post("/saints/register", json=saint_payload)
    assert r1.status_code == 201
    assert r2.status_code == 201


async def test_register_student_fields_stored(client, saint_payload):
    saint_payload["student"] = True
    saint_payload["university"] = "Makerere University"
    saint_payload["institution_location"] = "Kampala"
    resp = await client.post("/saints/register", json=saint_payload)
    data = resp.json()
    assert data["university"] == "Makerere University"
    assert data["institution_location"] == "Kampala"


async def test_register_first_time_flag_stored(client, saint_payload):
    saint_payload["first_time"] = True
    resp = await client.post("/saints/register", json=saint_payload)
    assert resp.json()["first_time"] is True
