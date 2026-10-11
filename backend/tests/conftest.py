"""Shared test fixtures and synthetic incident factories."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

IST = timezone(timedelta(hours=5, minutes=30))

# One day inside the default recent window (range end 2026-10-08).
RECENT = "2026-10-05"
# One day inside the previous window (30 days earlier).
PREVIOUS = "2026-09-05"


def make_incident(
    incident_id: str,
    *,
    area: str = "Area A",
    category: str = "Theft",
    status: str = "Reported",
    lat: float = 26.85,
    lng: float = 80.94,
    day: str = RECENT,
    hour: int = 21,
) -> dict:
    occurred = datetime.fromisoformat(f"{day}T{hour:02d}:30:00").replace(tzinfo=IST)
    return {
        "id": incident_id,
        "lat": lat,
        "lng": lng,
        "category": category,
        "occurredAt": occurred.isoformat(),
        "area": area,
        "description": "synthetic test incident",
        "status": status,
        "isDemo": True,
    }


@pytest.fixture
def sample_incidents() -> list[dict]:
    rows: list[dict] = []
    specs = [
        ("Area A", "Robbery", 26.8500, 80.9400, RECENT, 21, 4),
        ("Area A", "Robbery", 26.8505, 80.9405, RECENT, 21, 3),
        ("Area A", "Assault", 26.8510, 80.9410, PREVIOUS, 22, 3),
        ("Area B", "Theft", 26.8700, 80.9600, RECENT, 18, 5),
        ("Area B", "Theft", 26.8705, 80.9605, PREVIOUS, 19, 4),
        ("Area C", "Burglary", 26.9000, 81.0000, RECENT, 2, 2),
    ]
    counter = 0
    for area, category, lat, lng, day, hour, count in specs:
        for _ in range(count):
            counter += 1
            rows.append(
                make_incident(
                    f"INC-{counter:03d}",
                    area=area,
                    category=category,
                    lat=lat,
                    lng=lng,
                    day=day,
                    hour=hour,
                )
            )
    return rows
