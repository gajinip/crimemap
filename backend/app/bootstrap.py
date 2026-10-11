"""Schema bootstrap: enable PostGIS and create tables."""

from __future__ import annotations

from sqlalchemy import text

from . import models  # noqa: F401  (register mappings)
from .db import Base, get_engine


def init_schema() -> None:
    engine = get_engine()
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    Base.metadata.create_all(engine)


if __name__ == "__main__":
    init_schema()
    print("Schema ready.")
