from datetime import timedelta

from tests.helpers import API, PAST_DAY, make_athlete, workout


def _period(**extra):
    return {"date_from": PAST_DAY.isoformat(), "date_to": PAST_DAY.isoformat(), **extra}


def test_attendance_and_summary(client, coach):
    a = make_athlete(client, coach, "Анна")
    b = make_athlete(client, coach, "Борис")
    make_athlete(client, coach, "Архив", is_active=False)
    w = client.post(f"{API}/workouts", json=workout(PAST_DAY, "10:00", "11:00", athlete_ids=[a["id"], b["id"]]), headers=coach).json()
    items = [{"athlete_id": a["id"], "status": "present"}, {"athlete_id": b["id"], "status": "absent"}]
    client.put(f"{API}/workouts/{w['id']}/attendance", json={"items": items}, headers=coach)

    rep = client.get(f"{API}/reports/attendance", params=_period(), headers=coach).json()
    rows = {row["full_name"]: row for row in rep["items"]}
    assert set(rows) == {"Анна", "Борис"}
    assert rows["Анна"]["present"] == 1 and rows["Анна"]["percent"] == 100.0
    assert rows["Борис"]["absent"] == 1 and rows["Борис"]["percent"] == 0.0

    assert len(client.get(f"{API}/reports/attendance", params=_period(include_inactive=True), headers=coach).json()["items"]) == 3
    single = client.get(f"{API}/reports/attendance", params=_period(athlete_id=a["id"]), headers=coach).json()
    assert [row["athlete_id"] for row in single["items"]] == [a["id"]]

    summary = client.get(f"{API}/reports/summary", params=_period(), headers=coach).json()
    assert summary["workouts_held"] == 1 and summary["attendance_percent"] == 50.0


def test_report_validation(client, coach, other_coach):
    foreign = make_athlete(client, other_coach)
    assert client.get(f"{API}/reports/attendance", params=_period(athlete_id=foreign["id"]), headers=coach).status_code == 404

    reversed_period = {"date_from": PAST_DAY.isoformat(), "date_to": (PAST_DAY - timedelta(days=1)).isoformat()}
    assert client.get(f"{API}/reports/summary", params=reversed_period, headers=coach).status_code == 422
    too_long = {"date_from": PAST_DAY.isoformat(), "date_to": (PAST_DAY + timedelta(days=400)).isoformat()}
    assert client.get(f"{API}/reports/attendance", params=too_long, headers=coach).status_code == 422
    assert client.get(f"{API}/reports/summary", params={"date_from": PAST_DAY.isoformat()}, headers=coach).status_code == 422
