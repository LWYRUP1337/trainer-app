from tests.helpers import API, make_athlete


def test_athlete_crud_and_validation(client, coach):
    athlete = make_athlete(client, coach, "  Мария  ", height_cm=171, phone="+7 (900) 123-45-67")
    assert athlete["full_name"] == "Мария"

    assert client.post(f"{API}/athletes", json={"full_name": ""}, headers=coach).status_code == 422
    assert client.post(f"{API}/athletes", json={"full_name": "X", "height_cm": 10}, headers=coach).status_code == 422
    assert client.post(f"{API}/athletes", json={"full_name": "X", "phone": "abc"}, headers=coach).status_code == 422
    assert client.post(f"{API}/athletes", json={"full_name": "X", "birth_date": "2999-01-01"}, headers=coach).status_code == 422

    r = client.patch(f"{API}/athletes/{athlete['id']}", json={"nutrition_plan": "Овсянка"}, headers=coach)
    assert r.status_code == 200 and r.json()["nutrition_plan"] == "Овсянка"
    assert client.patch(f"{API}/athletes/{athlete['id']}", json={"full_name": None}, headers=coach).status_code == 422
    assert client.patch(f"{API}/athletes/{athlete['id']}", json={"height_cm": None}, headers=coach).status_code == 200

    assert client.delete(f"{API}/athletes/{athlete['id']}", headers=coach).status_code == 204
    assert client.get(f"{API}/athletes/{athlete['id']}", headers=coach).status_code == 404


def test_athlete_list_page_and_filters(client, coach):
    make_athlete(client, coach, "Мария")
    make_athlete(client, coach, "Марат", is_active=False)
    make_athlete(client, coach, "Олег_100%")

    r = client.get(f"{API}/athletes", params={"search": "мар"}, headers=coach)
    assert r.status_code == 200
    assert set(r.json()) == {"items", "total", "limit", "offset"}
    assert r.json()["total"] == 2

    assert client.get(f"{API}/athletes", params={"search": "%"}, headers=coach).json()["total"] == 1
    assert client.get(f"{API}/athletes", params={"is_active": False}, headers=coach).json()["total"] == 1

    page = client.get(f"{API}/athletes", params={"limit": 2, "offset": 2}, headers=coach).json()
    assert page["total"] == 3 and len(page["items"]) == 1 and page["limit"] == 2 and page["offset"] == 2

    assert client.get(f"{API}/athletes", params={"limit": 0}, headers=coach).status_code == 422
    assert client.get(f"{API}/athletes", params={"offset": -1}, headers=coach).status_code == 422


def test_coaches_are_isolated(client, coach, other_coach):
    athlete = make_athlete(client, coach, "Чужой")
    assert client.get(f"{API}/athletes/{athlete['id']}", headers=other_coach).status_code == 404
    assert client.patch(f"{API}/athletes/{athlete['id']}", json={"notes": "x"}, headers=other_coach).status_code == 404
    assert client.delete(f"{API}/athletes/{athlete['id']}", headers=other_coach).status_code == 404
    assert client.get(f"{API}/athletes", headers=other_coach).json()["total"] == 0
