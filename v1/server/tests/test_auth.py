import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt

from tests.conftest import (
    SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD,
    REGULAR_ADMIN_EMAIL,
    REGULAR_ADMIN_PASSWORD,
)


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_valid_credentials_returns_token(client, super_admin):
    resp = await client.post("/auth/login", json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_response_has_token_type_bearer(client, super_admin):
    resp = await client.post("/auth/login", json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD})
    assert resp.json()["token_type"] == "bearer"


async def test_login_super_admin_flag_correct(client, super_admin):
    resp = await client.post("/auth/login", json={"email": SUPER_ADMIN_EMAIL, "password": SUPER_ADMIN_PASSWORD})
    assert resp.json()["is_super_admin"] is True


async def test_login_regular_admin_is_super_admin_false(client, regular_admin):
    resp = await client.post("/auth/login", json={"email": REGULAR_ADMIN_EMAIL, "password": REGULAR_ADMIN_PASSWORD})
    assert resp.json()["is_super_admin"] is False


async def test_login_wrong_password_returns_401(client, super_admin):
    resp = await client.post("/auth/login", json={"email": SUPER_ADMIN_EMAIL, "password": "wrong"})
    assert resp.status_code == 401


async def test_login_nonexistent_email_returns_401(client):
    resp = await client.post("/auth/login", json={"email": "nobody@x.com", "password": "x"})
    assert resp.status_code == 401


async def test_login_missing_password_returns_422(client):
    resp = await client.post("/auth/login", json={"email": "x@x.com"})
    assert resp.status_code == 422


# ── Setup ─────────────────────────────────────────────────────────────────────

async def test_setup_creates_super_admin_when_no_admins(client):
    resp = await client.post(
        "/auth/setup",
        json={"name": "First Admin", "email": "first@church.com", "password": "pass123", "is_super_admin": False},
    )
    assert resp.status_code == 201
    assert "access_token" in resp.json()


async def test_setup_response_always_is_super_admin_true(client):
    resp = await client.post(
        "/auth/setup",
        json={"name": "First Admin", "email": "first@church.com", "password": "pass123", "is_super_admin": False},
    )
    assert resp.json()["is_super_admin"] is True


async def test_setup_returns_403_when_admins_exist(client, super_admin):
    resp = await client.post(
        "/auth/setup",
        json={"name": "Second", "email": "second@church.com", "password": "pass"},
    )
    assert resp.status_code == 403


# ── /auth/me ──────────────────────────────────────────────────────────────────

async def test_me_returns_current_admin(client, auth_super, super_admin):
    resp = await client.get("/auth/me", headers=auth_super)
    assert resp.status_code == 200
    assert resp.json()["id"] == str(super_admin.id)


async def test_me_response_matches_admin_email(client, auth_super, super_admin):
    resp = await client.get("/auth/me", headers=auth_super)
    assert resp.json()["email"] == super_admin.email


async def test_me_without_auth_returns_401(client):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401


async def test_me_with_invalid_token_returns_401(client):
    resp = await client.get("/auth/me", headers={"Authorization": "Bearer invalid_garbage"})
    assert resp.status_code == 401


# ── List admins ───────────────────────────────────────────────────────────────

async def test_list_admins_returns_200_with_admin_auth(client, auth_regular):
    resp = await client.get("/auth/admins", headers=auth_regular)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_list_admins_no_auth_returns_401(client):
    resp = await client.get("/auth/admins")
    assert resp.status_code == 401


# ── Create admin ──────────────────────────────────────────────────────────────

async def test_create_admin_with_super_admin_returns_201(client, auth_super):
    resp = await client.post(
        "/auth/admins",
        json={"name": "New Admin", "email": "new@church.com", "password": "newpass"},
        headers=auth_super,
    )
    assert resp.status_code == 201
    assert resp.json()["email"] == "new@church.com"


async def test_create_admin_with_regular_admin_returns_403(client, auth_regular):
    resp = await client.post(
        "/auth/admins",
        json={"name": "New Admin", "email": "new2@church.com", "password": "pass"},
        headers=auth_regular,
    )
    assert resp.status_code == 403


async def test_create_admin_no_auth_returns_401(client):
    resp = await client.post(
        "/auth/admins",
        json={"name": "New Admin", "email": "new3@church.com", "password": "pass"},
    )
    assert resp.status_code == 401


# ── Delete admin ──────────────────────────────────────────────────────────────

async def test_delete_regular_admin_with_super_returns_204(client, auth_super, regular_admin):
    resp = await client.delete(f"/auth/admins/{regular_admin.id}", headers=auth_super)
    assert resp.status_code == 204


async def test_delete_super_admin_returns_404(client, auth_super, super_admin):
    # Super admins are protected — delete_admin returns False for them
    resp = await client.delete(f"/auth/admins/{super_admin.id}", headers=auth_super)
    assert resp.status_code == 404


async def test_delete_nonexistent_admin_returns_404(client, auth_super):
    resp = await client.delete(f"/auth/admins/{uuid.uuid4()}", headers=auth_super)
    assert resp.status_code == 404


async def test_delete_admin_regular_token_returns_403(client, auth_regular, regular_admin):
    resp = await client.delete(f"/auth/admins/{regular_admin.id}", headers=auth_regular)
    assert resp.status_code == 403


# ── Token edge cases ──────────────────────────────────────────────────────────

async def test_expired_token_returns_401(client, super_admin):
    expired_token = jwt.encode(
        {
            "sub": str(super_admin.id),
            "email": super_admin.email,
            "is_super_admin": True,
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        "test-secret-key",
        algorithm="HS256",
    )
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


async def test_token_for_deleted_admin_returns_401(client, auth_super, regular_admin, regular_admin_token):
    await client.delete(f"/auth/admins/{regular_admin.id}", headers=auth_super)
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {regular_admin_token}"})
    assert resp.status_code == 401


# ── Saint listing (admin-only) ─────────────────────────────────────────────────

async def test_list_saints_with_admin_token_returns_200(client, auth_super, registered_saint):
    resp = await client.get("/saints", headers=auth_super)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_list_saints_without_auth_returns_401(client):
    resp = await client.get("/saints")
    assert resp.status_code == 401


async def test_get_saint_by_id_requires_auth(client, registered_saint):
    resp = await client.get(f"/saints/{registered_saint['id']}")
    assert resp.status_code == 401


async def test_get_saint_by_id_returns_stats(client, auth_super, registered_saint):
    resp = await client.get(f"/saints/{registered_saint['id']}", headers=auth_super)
    assert resp.status_code == 200
    data = resp.json()
    assert "attendance_count" in data
    assert data["attendance_count"] == 0
    assert data["last_seen"] is None


async def test_get_saint_by_id_not_found_returns_404(client, auth_super):
    resp = await client.get(f"/saints/{uuid.uuid4()}", headers=auth_super)
    assert resp.status_code == 404


async def test_get_saint_with_checkin_shows_attendance(client, auth_super, registered_saint, fixed_today):
    await client.post("/saints/checkin", json={"saint_id": registered_saint["id"]})
    resp = await client.get(f"/saints/{registered_saint['id']}", headers=auth_super)
    data = resp.json()
    assert data["attendance_count"] == 1
    assert data["last_seen"] is not None
