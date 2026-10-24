from tests.helpers import API


def test_register_login_and_me(client):
    body = {"email": "A@Example.com", "password": "password123", "full_name": "  Анна  "}
    r = client.post(f"{API}/auth/register", json=body)
    assert r.status_code == 201
    assert r.json()["email"] == "a@example.com"
    assert r.json()["full_name"] == "Анна"
    assert "password_hash" not in r.json()

    assert client.post(f"{API}/auth/register", json=body).json()["code"] == "email_taken"

    token = client.post(f"{API}/auth/login", data={"username": "a@example.com", "password": "password123"}).json()
    assert token["token_type"] == "bearer"
    headers = {"Authorization": f"Bearer {token['access_token']}"}

    r = client.patch(f"{API}/auth/me", json={"full_name": "Анна Б."}, headers=headers)
    assert r.status_code == 200 and r.json()["full_name"] == "Анна Б."
    assert client.patch(f"{API}/auth/me", json={"full_name": None}, headers=headers).status_code == 422


def test_register_validation(client):
    base = {"email": "b@example.com", "password": "password123", "full_name": "B"}
    assert client.post(f"{API}/auth/register", json={**base, "password": "short"}).status_code == 422
    assert client.post(f"{API}/auth/register", json={**base, "password": "я" * 40}).status_code == 422
    assert client.post(f"{API}/auth/register", json={**base, "email": "not-email"}).status_code == 422


def test_unauthorized_responses(client):
    client.post(f"{API}/auth/register", json={"email": "a@example.com", "password": "password123", "full_name": "A"})

    r = client.post(f"{API}/auth/login", data={"username": "a@example.com", "password": "wrong-pass"})
    assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    r = client.post(f"{API}/auth/login", data={"username": "nobody@example.com", "password": "password123"})
    assert r.status_code == 401

    r = client.get(f"{API}/athletes")
    assert r.status_code == 401 and r.json()["code"] == "unauthorized"
    assert r.headers["www-authenticate"] == "Bearer"
    assert client.get(f"{API}/athletes", headers={"Authorization": "Bearer garbage"}).status_code == 401
