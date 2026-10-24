from tests.helpers import API, PAST_DAY, make_athlete, workout

TOO_BIG_ID = 2**31


def test_out_of_range_ids_are_rejected(client, coach):
    assert client.get(f"{API}/athletes/{TOO_BIG_ID}", headers=coach).status_code == 422
    assert client.get(f"{API}/athletes/0", headers=coach).status_code == 422
    assert client.delete(f"{API}/workouts/1/participants/{TOO_BIG_ID}", headers=coach).status_code == 422

    body = workout(PAST_DAY, "10:00", "11:00", athlete_ids=[TOO_BIG_ID])
    assert client.post(f"{API}/workouts", json=body, headers=coach).status_code == 422

    params = {"date_from": PAST_DAY.isoformat(), "date_to": PAST_DAY.isoformat(), "athlete_id": TOO_BIG_ID}
    assert client.get(f"{API}/reports/attendance", params=params, headers=coach).status_code == 422


def test_request_size_limits(client, coach):
    body = workout(PAST_DAY, "10:00", "11:00", athlete_ids=list(range(1, 102)))
    assert client.post(f"{API}/workouts", json=body, headers=coach).status_code == 422

    make_athlete(client, coach)
    w =client.post(f"{API}/workouts", json=workout(PAST_DAY, "12:00", "13:00"), headers=coach).json()
    items = [{"athlete_id": i, "status": "excused"} for i in range(1, 102)]
    assert client.put(f"{API}/workouts/{w['id']}/attendance", json={"items": items}, headers=coach).status_code == 422

    assert client.post(f"{API}/athletes", json={"full_name": "X", "notes": "x" * 5001}, headers=coach).status_code == 422
    assert client.get(f"{API}/athletes", params={"search": "x" * 101}, headers=coach).status_code == 422
    assert client.get(f"{API}/athletes", params={"search": "   "}, headers=coach).json()["total"] == 1
