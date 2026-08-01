import uuid


async def test_self_update_no_auth_required(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}/self-update",
        json={"occupation": "Teacher"},
    )
    assert resp.status_code == 200


async def test_self_update_updates_single_field(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}/self-update",
        json={"occupation": "Doctor"},
    )
    assert resp.json()["occupation"] == "Doctor"


async def test_self_update_partial_leaves_other_fields_unchanged(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}/self-update",
        json={"occupation": "Nurse"},
    )
    assert resp.json()["first_name"] == registered_saint["first_name"]
    assert resp.json()["email"] == registered_saint["email"]


async def test_self_update_normalizes_first_name(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}/self-update",
        json={"first_name": "  jANE  "},
    )
    assert resp.json()["first_name"] == "Jane"


async def test_self_update_normalizes_last_name(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}/self-update",
        json={"last_name": "  SMITH jones  "},
    )
    assert resp.json()["last_name"] == "Smith Jones"


async def test_self_update_nonexistent_saint_returns_404(client):
    resp = await client.patch(
        f"/saints/{uuid.uuid4()}/self-update",
        json={"occupation": "X"},
    )
    assert resp.status_code == 404


async def test_admin_update_requires_auth(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}",
        json={"occupation": "Pilot"},
    )
    assert resp.status_code == 401


async def test_admin_update_with_invalid_token_returns_401(client, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}",
        json={"occupation": "Pilot"},
        headers={"Authorization": "Bearer garbage_token"},
    )
    assert resp.status_code == 401


async def test_admin_update_with_regular_token_succeeds(client, auth_regular, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}",
        json={"first_time": True},
        headers=auth_regular,
    )
    assert resp.status_code == 200
    assert resp.json()["first_time"] is True


async def test_admin_update_nonexistent_saint_returns_404(client, auth_super):
    resp = await client.patch(
        f"/saints/{uuid.uuid4()}",
        json={"occupation": "X"},
        headers=auth_super,
    )
    assert resp.status_code == 404


async def test_admin_update_normalizes_name(client, auth_super, registered_saint):
    resp = await client.patch(
        f"/saints/{registered_saint['id']}",
        json={"first_name": "  mARY  "},
        headers=auth_super,
    )
    assert resp.json()["first_name"] == "Mary"
