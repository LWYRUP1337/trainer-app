from datetime import UTC, date, datetime, time, timedelta

from fastapi.testclient import TestClient

API = "/api/v1"
PAST_DAY = date.today() - timedelta(days=30)


def make_coach(client: TestClient, email: str) -> dict:
    password = "password123"
    r = client.post(f"{API}/auth/register", json={"email": email, "password": password, "full_name": "Тренер"})
    assert r.status_code == 201, r.text
    r = client.post(f"{API}/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def make_athlete(client: TestClient, headers: dict, full_name: str = "Игорь", **extra) -> dict:
    r = client.post(f"{API}/athletes", json={"full_name": full_name, **extra}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def at(day: date, hh_mm: str) -> str:
    return datetime.combine(day, time.fromisoformat(hh_mm), tzinfo=UTC).isoformat()


def workout(day: date, start: str, end: str, **extra) -> dict:
    return {"title": "Силовая", "starts_at": at(day, start), "ends_at": at(day, end), **extra}


def next_monday() -> date:
    today = date.today()
    return today + timedelta(days=7 - today.weekday())
