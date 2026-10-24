from datetime import date, timedelta

from tests.helpers import API, make_athlete

STARTED = (date.today() - timedelta(days=40)).isoformat()
BEFORE_STARTED = (date.today() - timedelta(days=50)).isoformat()
RECOVERED = (date.today() - timedelta(days=10)).isoformat()
TOMORROW = (date.today() + timedelta(days=1)).isoformat()


def _injury(**extra):
    return {"title": "Колено", "body_part": "Колено", "severity": "medium", "started_at": STARTED, **extra}


def test_injury_lifecycle(client, coach):
    a = make_athlete(client, coach, "Анна")
    url = f"{API}/athletes/{a['id']}/injuries"

    assert client.post(url, json=_injury(recovered_at=BEFORE_STARTED), headers=coach).status_code == 422
    assert client.post(url, json=_injury(started_at=TOMORROW), headers=coach).status_code == 422

    inj = client.post(url, json=_injury(), headers=coach)
    assert inj.status_code == 201
    injury_id = inj.json()["id"]

    assert client.get(f"{API}/athletes", params={"has_active_injury": True}, headers=coach).json()["total"] == 1

    r = client.patch(f"{API}/injuries/{injury_id}", json={"recovered_at": BEFORE_STARTED}, headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "invalid_dates"
    assert client.patch(f"{API}/injuries/{injury_id}", json={"severity": None}, headers=coach).status_code == 422

    assert client.patch(f"{API}/injuries/{injury_id}", json={"recovered_at": RECOVERED}, headers=coach).status_code == 200
    assert client.get(url, params={"status": "active"}, headers=coach).json() == []
    assert len(client.get(url, params={"status": "recovered"}, headers=coach).json()) == 1
    assert client.get(url, params={"status": "unknown"}, headers=coach).status_code == 422
    assert client.get(f"{API}/athletes", params={"has_active_injury": False}, headers=coach).json()["total"] == 1

    assert client.delete(f"{API}/injuries/{injury_id}", headers=coach).status_code == 204
    assert client.get(f"{API}/injuries/{injury_id}", headers=coach).status_code == 404


def test_injuries_are_isolated(client, coach, other_coach):
    a = make_athlete(client, coach, "Анна")
    injury = client.post(f"{API}/athletes/{a['id']}/injuries", json=_injury(), headers=coach).json()

    assert client.get(f"{API}/injuries/{injury['id']}", headers=other_coach).status_code == 404
    assert client.get(f"{API}/athletes/{a['id']}/injuries", headers=other_coach).status_code == 404
    assert client.post(f"{API}/athletes/{a['id']}/injuries", json=_injury(), headers=other_coach).status_code == 404
