from datetime import timedelta

from tests.helpers import API, PAST_DAY, at, make_athlete, next_monday, workout


def test_workout_overlaps(client, coach, other_coach):
    r = client.post(f"{API}/workouts", json=workout(PAST_DAY, "18:00", "19:30"), headers=coach)
    assert r.status_code == 201
    w = r.json()

    clash = client.post(f"{API}/workouts", json=workout(PAST_DAY, "19:00", "20:00"), headers=coach)
    assert clash.status_code == 409 and clash.json()["code"] == "time_conflict"
    assert clash.json()["conflicting_workout_id"] == w["id"]

    assert client.post(f"{API}/workouts", json=workout(PAST_DAY, "19:30", "20:30"), headers=coach).status_code == 201
    assert client.post(f"{API}/workouts", json=workout(PAST_DAY, "18:00", "19:00"), headers=other_coach).status_code == 201

    r = client.patch(f"{API}/workouts/{w['id']}", json={"ends_at": at(PAST_DAY, "20:00")}, headers=coach)
    assert r.status_code == 409


def test_workout_validation(client, coach):
    day = PAST_DAY + timedelta(days=1)
    assert client.post(f"{API}/workouts", json=workout(day, "10:00", "09:00"), headers=coach).status_code == 422
    assert client.post(f"{API}/workouts", json=workout(day, "10:00", "11:00", athlete_ids=[9999]), headers=coach).status_code == 422
    naive = {"title": "Силовая", "starts_at": f"{day}T10:00:00", "ends_at": f"{day}T11:00:00"}
    assert client.post(f"{API}/workouts", json=naive, headers=coach).status_code == 422

    w = client.post(f"{API}/workouts", json=workout(day, "10:00", "11:00"), headers=coach).json()
    too_long = {"ends_at": at(day + timedelta(days=2), "11:00")}
    r = client.patch(f"{API}/workouts/{w['id']}", json=too_long, headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "invalid_time_range"
    assert client.patch(f"{API}/workouts/{w['id']}", json={"starts_at": at(day, "12:00")}, headers=coach).status_code == 422
    assert client.patch(f"{API}/workouts/{w['id']}", json={"title": None}, headers=coach).status_code == 422


def test_archived_athlete_cannot_join(client, coach):
    archived = make_athlete(client, coach, "Архив", is_active=False)
    r = client.post(f"{API}/workouts", json=workout(PAST_DAY, "10:00", "11:00", athlete_ids=[archived["id"]]), headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "athletes_inactive"


def test_attendance_and_cascade(client, coach):
    a = make_athlete(client, coach, "Игорь")
    w = client.post(f"{API}/workouts", json=workout(PAST_DAY, "18:00", "19:30", athlete_ids=[a["id"]]), headers=coach).json()
    assert w["participants"][0]["status"] == "planned"
    assert w["participants"][0]["athlete_name"] == "Игорь"

    url = f"{API}/workouts/{w['id']}/attendance"
    r = client.put(url, json={"items": [{"athlete_id": a["id"], "status": "present"}]}, headers=coach)
    assert r.status_code == 200 and r.json()["participants"][0]["status"] == "present"

    b = make_athlete(client, coach, "Борис")
    r = client.put(url, json={"items": [{"athlete_id": b["id"], "status": "absent"}]}, headers=coach)
    assert len(r.json()["participants"]) == 2

    assert client.delete(f"{API}/workouts/{w['id']}/participants/{b['id']}", headers=coach).status_code == 204
    assert client.delete(f"{API}/workouts/{w['id']}/participants/{b['id']}", headers=coach).status_code == 404

    assert client.delete(f"{API}/athletes/{a['id']}", headers=coach).status_code == 204
    assert client.get(f"{API}/workouts/{w['id']}", headers=coach).json()["participants"] == []

    assert client.delete(f"{API}/workouts/{w['id']}", headers=coach).status_code == 204
    assert client.get(f"{API}/workouts/{w['id']}", headers=coach).status_code == 404


def test_attendance_for_future_workout(client, coach):
    a = make_athlete(client, coach)
    w = client.post(f"{API}/workouts", json=workout(next_monday(), "10:00", "11:00", athlete_ids=[a["id"]]), headers=coach).json()
    url = f"{API}/workouts/{w['id']}/attendance"

    r = client.put(url, json={"items": [{"athlete_id": a["id"], "status": "present"}]}, headers=coach)
    assert r.status_code == 422 and r.json()["code"] == "workout_not_started"
    r = client.put(url, json={"items": [{"athlete_id": a["id"], "status": "excused", "comment": "Болеет"}]}, headers=coach)
    assert r.status_code == 200 and r.json()["participants"][0]["comment"] == "Болеет"
    dup = {"items": [{"athlete_id": a["id"], "status": "excused"}, {"athlete_id": a["id"], "status": "planned"}]}
    assert client.put(url, json=dup, headers=coach).status_code == 422


def test_calendar_filters(client, coach):
    client.post(f"{API}/workouts", json=workout(PAST_DAY, "08:00", "09:00"), headers=coach)
    client.post(f"{API}/workouts", json=workout(PAST_DAY, "10:00", "11:00"), headers=coach)

    r = client.get(f"{API}/workouts", params={"year": PAST_DAY.year, "month": PAST_DAY.month}, headers=coach)
    assert r.status_code == 200 and len(r.json()) == 2
    assert r.json()[0]["starts_at"] < r.json()[1]["starts_at"]

    r = client.get(f"{API}/workouts", params={"date_from": at(PAST_DAY, "09:30"), "date_to": at(PAST_DAY, "23:00")}, headers=coach)
    assert len(r.json()) == 1

    assert client.get(f"{API}/workouts", params={"month": 5}, headers=coach).status_code == 422
    assert client.get(f"{API}/workouts", params={"year": 2026, "date_from": at(PAST_DAY, "00:00")}, headers=coach).status_code == 422
    bad_range = {"date_from": at(PAST_DAY, "10:00"), "date_to": at(PAST_DAY, "09:00")}
    assert client.get(f"{API}/workouts", params=bad_range, headers=coach).status_code == 422
