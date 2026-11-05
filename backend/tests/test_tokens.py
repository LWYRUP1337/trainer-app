import re
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from sqlalchemy import update

from app.core.config import get_settings
from app.core.security import ALGORITHM, create_access_token
from app.db.session import SessionLocal
from app.main import app as fastapi_app
from app.modules.auth.models import RefreshToken
from tests.helpers import API

EMAIL, PASSWORD = "coach@example.com", "password123"
PUBLIC_ROUTES = {
    ("POST", f"{API}/auth/register"),
    ("POST", f"{API}/auth/login"),
    ("POST", f"{API}/auth/refresh"),
    ("POST", f"{API}/auth/logout"),
    ("GET", "/health"),
}


@pytest.fixture()
def user(client):
    r = client.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "full_name": "Тренер"})
    assert r.status_code == 201
    return r.json()


def login(client):
    r = client.post(f"{API}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    assert r.status_code == 200, r.text
    return r


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def refresh_with(client, refresh_token: str | None):
    client.cookies.clear()
    headers = {"Cookie": f"refresh_token={refresh_token}"} if refresh_token else {}
    return client.post(f"{API}/auth/refresh", headers=headers)


def test_login_issues_access_and_refresh_tokens(client, user):
    r = login(client)
    body = r.json()
    assert set(body) == {"access_token", "token_type", "expires_in"}
    assert body["expires_in"] == get_settings().access_token_expire_minutes * 60
    assert r.headers["cache-control"] == "no-store"

    cookie = r.headers["set-cookie"].lower()
    assert "refresh_token=" in cookie and "httponly" in cookie and "samesite=strict" in cookie
    assert "path=/api/v1/auth" in cookie
    assert f"max-age={get_settings().refresh_token_expire_days * 24 * 3600}" in cookie

    payload = jwt.decode(body["access_token"], get_settings().secret_key, algorithms=[ALGORITHM])
    assert payload["sub"] == str(user["id"]) and payload["type"] == "access"
    assert payload["exp"] - payload["iat"] == get_settings().access_token_expire_minutes * 60

    me = client.get(f"{API}/auth/me", headers=bearer(body["access_token"]))
    assert me.status_code == 200 and me.json()["email"] == EMAIL


def test_refresh_cookie_is_secure_by_default(client, user, monkeypatch):
    monkeypatch.setattr(get_settings(), "refresh_cookie_secure", True)
    assert "secure" in login(client).headers["set-cookie"].lower()


def test_refresh_rotates_tokens(client, user):
    first = login(client).cookies["refresh_token"]

    r = refresh_with(client, first)
    assert r.status_code == 200
    second = r.cookies["refresh_token"]
    assert second != first
    assert client.get(f"{API}/auth/me", headers=bearer(r.json()["access_token"])).status_code == 200

    r = refresh_with(client, second)
    assert r.status_code == 200 and r.cookies["refresh_token"] not in {first, second}


def test_reused_refresh_token_revokes_session(client, user):
    first = login(client).cookies["refresh_token"]
    second = refresh_with(client, first).cookies["refresh_token"]

    r = refresh_with(client, first)
    assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    assert refresh_with(client, second).status_code == 401


def test_invalid_and_expired_refresh_tokens_are_rejected(client, user):
    assert refresh_with(client, None).status_code == 401
    assert refresh_with(client, "garbage").status_code == 401

    token = login(client).cookies["refresh_token"]
    with SessionLocal() as db:
        db.execute(update(RefreshToken).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
        db.commit()
    assert refresh_with(client, token).status_code == 401


def test_logout_revokes_only_current_session(client, user):
    phone = login(client).cookies["refresh_token"]
    laptop = login(client).cookies["refresh_token"]

    client.cookies.clear()
    r = client.post(f"{API}/auth/logout", headers={"Cookie": f"refresh_token={phone}"})
    assert r.status_code == 204
    cleared = r.headers["set-cookie"].lower()
    assert 'refresh_token=""' in cleared and "max-age=0" in cleared and "path=/api/v1/auth" in cleared

    assert refresh_with(client, phone).status_code == 401
    assert refresh_with(client, laptop).status_code == 200


def test_logout_without_session_is_idempotent(client):
    assert client.post(f"{API}/auth/logout").status_code == 204
    client.cookies.clear()
    assert client.post(f"{API}/auth/logout", headers={"Cookie": "refresh_token=garbage"}).status_code == 204


def test_bad_access_tokens_are_rejected(client, user):
    settings = get_settings()
    now = datetime.now(UTC)
    claims = {"sub": str(user["id"]), "type": "access", "iat": now}
    expired = jwt.encode({**claims, "exp": now - timedelta(seconds=1)}, settings.secret_key, algorithm=ALGORITHM)
    foreign = jwt.encode({**claims, "exp": now + timedelta(minutes=5)}, "x" * 40, algorithm=ALGORITHM)
    wrong_type = jwt.encode({**claims, "type": "refresh", "exp": now + timedelta(minutes=5)}, settings.secret_key, algorithm=ALGORITHM)
    no_exp = jwt.encode(claims, settings.secret_key, algorithm=ALGORITHM)
    unsigned = jwt.encode({**claims, "exp": now + timedelta(minutes=5)}, None, algorithm="none")
    unknown_user = create_access_token(user["id"] + 1000)

    for token in (expired, foreign, wrong_type, no_exp, unsigned, unknown_user):
        r = client.get(f"{API}/auth/me", headers=bearer(token))
        assert r.status_code == 401, token
        assert r.json()["code"] == "unauthorized"

    assert client.get(f"{API}/auth/me", headers=bearer(create_access_token(user["id"]))).status_code == 200


def test_public_and_private_routes(client):
    assert client.get("/health").status_code == 200

    private = [
        (method.upper(), path)
        for path, operations in fastapi_app.openapi()["paths"].items()
        for method in operations
        if (method.upper(), path) not in PUBLIC_ROUTES
    ]
    assert len(private) > 20
    for method, path in private:
        r = client.request(method, re.sub(r"\{[^}]+\}", "1", path))
        assert r.status_code == 401, (method, path, r.status_code)
