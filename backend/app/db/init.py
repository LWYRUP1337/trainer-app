from sqlalchemy import text

import app.db.models  # noqa: F401
from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
        Base.metadata.create_all(conn)
