"""Read helpers that return plain dicts for the analytics engines."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .dto import incident_to_dict, station_to_dict
from .models import Incident, Station


def load_incidents(db: Session) -> list[dict]:
    rows = db.scalars(select(Incident)).all()
    return [incident_to_dict(row) for row in rows]


def load_stations(db: Session) -> list[dict]:
    rows = db.scalars(select(Station)).all()
    return [station_to_dict(row) for row in rows]
