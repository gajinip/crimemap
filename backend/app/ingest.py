"""Dataset ingestion: load, validate, deduplicate, normalise, persist.

Mirrors the fields the React app consumes. Validation is enforced here because
the client has none at runtime (see CRIMEMAP_FEATURE_AUDIT.md, section 3.6).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from geoalchemy2.elements import WKTElement
from sqlalchemy import delete
from sqlalchemy.orm import Session

from .analytics import parse_dt
from .models import Area, Incident, Station

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

CATEGORIES = {
    "Theft",
    "Robbery",
    "Assault",
    "Burglary",
    "Vehicle Theft",
    "Fraud",
    "Other",
}
STATUSES = {"Reported", "Under Investigation", "Closed"}


@dataclass
class IngestReport:
    loaded: int = 0
    inserted: int = 0
    duplicates: int = 0
    rejected: int = 0
    errors: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "loaded": self.loaded,
            "inserted": self.inserted,
            "duplicates": self.duplicates,
            "rejected": self.rejected,
            "errors": self.errors[:50],
            "errorCount": len(self.errors),
        }


def load_json(name: str) -> list[dict]:
    path = DATA_DIR / f"{name}.json"
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_incident(record: dict) -> str | None:
    """Return an error string, or None when the record is valid."""
    if not record.get("id"):
        return "missing id"
    try:
        lat = float(record["lat"])
        lng = float(record["lng"])
    except (KeyError, TypeError, ValueError):
        return f"{record.get('id')}: non-numeric coordinates"
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return f"{record['id']}: coordinates out of range ({lat},{lng})"
    if record.get("category") not in CATEGORIES:
        return f"{record['id']}: invalid category {record.get('category')!r}"
    if record.get("status") not in STATUSES:
        return f"{record['id']}: invalid status {record.get('status')!r}"
    if not str(record.get("area", "")).strip():
        return f"{record['id']}: missing area"
    if parse_dt(record.get("occurredAt", "")) is None:
        return f"{record['id']}: invalid timestamp {record.get('occurredAt')!r}"
    return None


def dedupe(records: list[dict], key: str = "id") -> tuple[list[dict], int]:
    seen: set[str] = set()
    unique: list[dict] = []
    duplicates = 0
    for record in records:
        value = record.get(key)
        if value in seen:
            duplicates += 1
            continue
        seen.add(value)
        unique.append(record)
    return unique, duplicates


def _point(lat: float, lng: float) -> WKTElement:
    return WKTElement(f"POINT({lng} {lat})", srid=4326)


def ingest_all(db: Session, *, replace: bool = True) -> dict:
    report = IngestReport()

    incidents_raw = load_json("incidents")
    stations_raw = load_json("stations")
    areas_raw = load_json("areas")
    report.loaded = len(incidents_raw) + len(stations_raw) + len(areas_raw)

    valid_incidents: list[dict] = []
    for record in incidents_raw:
        error = validate_incident(record)
        if error:
            report.rejected += 1
            report.errors.append(error)
        else:
            valid_incidents.append(record)

    incidents, dup_inc = dedupe(valid_incidents)
    stations, dup_sta = dedupe(stations_raw)
    report.duplicates = dup_inc + dup_sta

    if replace:
        db.execute(delete(Incident))
        db.execute(delete(Station))
        db.execute(delete(Area))

    db.add_all(
        [
            Incident(
                id=r["id"],
                category=r["category"],
                status=r["status"],
                area=r["area"],
                description=r.get("description", ""),
                occurred_at=parse_dt(r["occurredAt"]),
                is_demo=bool(r.get("isDemo", True)),
                lat=float(r["lat"]),
                lng=float(r["lng"]),
                geom=_point(float(r["lat"]), float(r["lng"])),
            )
            for r in incidents
        ]
    )
    db.add_all(
        [
            Station(
                id=r["id"],
                name=r["name"],
                area=r["area"],
                jurisdiction=list(r.get("jurisdiction", [])),
                is_demo=bool(r.get("isDemo", True)),
                lat=float(r["lat"]),
                lng=float(r["lng"]),
                geom=_point(float(r["lat"]), float(r["lng"])),
            )
            for r in stations
        ]
    )
    db.add_all(
        [Area(name=r["name"], lat=float(r["lat"]), lng=float(r["lng"])) for r in areas_raw]
    )

    report.inserted = len(incidents) + len(stations) + len(areas_raw)
    db.commit()
    return report.as_dict()


if __name__ == "__main__":  # pragma: no cover - CLI convenience
    from .bootstrap import init_schema
    from .db import get_session_factory

    init_schema()
    session = get_session_factory()()
    try:
        print(ingest_all(session))
    finally:
        session.close()
