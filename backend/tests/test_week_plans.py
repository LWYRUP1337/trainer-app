from tests.helpers import API, make_athlete, next_monday, workout

SLOT = {"weekday": 1, "start_time": "18:00", "end_time": "19:30", "title": "Силовая"}


def test_plan_items_and_overlaps(client, coach):
    overlapping = {**SLOT, "start_time": "19:00", "end_time": "20:00", "title": "Кардио"}
    r = client.post(f"{API}/week-plans", json={"title": "База", "items": [SLOT, overlapping]}, headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "plan_items_overlap"

    plan = client.post(f"{API}/week-plans", json={"title": "База", "items": [SLOT]}, headers=coach)
    assert plan.status_code == 201
    plan_id = plan.json()["id"]

    assert client.post(f"{API}/week-plans/{plan_id}/items", json=overlapping, headers=coach).status_code == 422
    r = client.post(f"{API}/week-plans/{plan_id}/items", json={**overlapping, "weekday": 3}, headers=coach)
    assert r.status_code == 201 and len(r.json()["items"]) == 2
    item_id = r.json()["items"][1]["id"]

    assert client.patch(f"{API}/week-plans/{plan_id}/items/{item_id}", json={"weekday": 1}, headers=coach).status_code == 422
    r = client.patch(f"{API}/week-plans/{plan_id}/items/{item_id}", json={"end_time": "18:00"}, headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "invalid_time_range"

    assert client.patch(f"{API}/week-plans/{plan_id}", json={"title": "Новая"}, headers=coach).json()["title"] == "Новая"
    assert client.delete(f"{API}/week-plans/{plan_id}/items/{item_id}", headers=coach).status_code == 204
    assert len(client.get(f"{API}/week-plans/{plan_id}", headers=coach).json()["items"]) == 1
    assert client.delete(f"{API}/week-plans/{plan_id}", headers=coach).status_code == 204
    assert client.get(f"{API}/week-plans", headers=coach).json() == []


def test_apply_skips_conflicts(client, coach):
    monday = next_monday()
    a = make_athlete(client, coach)
    plan_id = client.post(f"{API}/week-plans", json={"title": "База", "items": [SLOT]}, headers=coach).json()["id"]

    client.post(f"{API}/workouts", json=workout(monday, "18:30", "19:00"), headers=coach)
    r = client.post(
        f"{API}/week-plans/{plan_id}/apply",
        json={"start_date": monday.isoformat(), "weeks": 3, "athlete_ids": [a["id"]]},
        headers=coach,
    )
    assert r.status_code == 201
    assert r.json()["created_count"] == 2 and len(r.json()["skipped"]) == 1
    assert r.json()["skipped"][0]["date"] == monday.isoformat()

    created = client.get(f"{API}/workouts/{r.json()['created_ids'][0]}", headers=coach).json()
    assert created["week_plan_id"] == plan_id and created["participants"][0]["athlete_id"] == a["id"]


def test_apply_validation(client, coach, other_coach):
    empty_id = client.post(f"{API}/week-plans", json={"title": "Пусто"}, headers=coach).json()["id"]
    body = {"start_date": next_monday().isoformat(), "weeks": 1}
    r = client.post(f"{API}/week-plans/{empty_id}/apply", json=body, headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "empty_plan"

    plan_id = client.post(f"{API}/week-plans", json={"title": "База", "items": [SLOT]}, headers=coach).json()["id"]
    assert client.post(f"{API}/week-plans/{plan_id}/apply", json={**body, "timezone": "Mars/Base"}, headers=coach).status_code == 422
    assert client.post(f"{API}/week-plans/{plan_id}/apply", json={**body, "weeks": 0}, headers=coach).status_code == 422
    assert client.post(f"{API}/week-plans/{plan_id}/apply", json=body, headers=other_coach).status_code == 404
