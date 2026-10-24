import os

import pytest

TEST_DB = os.environ.get("TEST_DATABASE_URL")
if not TEST_DB:
    pytest.exit("Задайте TEST_DATABASE_URL (отдельная БД, её таблицы будут удаляться)", returncode=2)
os.environ["DATABASE_URL"] = TEST_DB
os.environ.setdefault("SECRET_KEY", "test-secret-key-test-secret-key-1234")
os.environ["DEFAULT_TIMEZONE"] = "UTC"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.init import init_db  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402
from tests.helpers import make_coach  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def schema():
    Base.metadata.drop_all(engine)
    init_db()


@pytest.fixture()
def client():
    tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    with TestClient(fastapi_app) as c:
        yield c


@pytest.fixture()
def coach(client):
    return make_coach(client, "coach1@example.com")


@pytest.fixture()
def other_coach(client):
    return make_coach(client, "coach2@example.com")
