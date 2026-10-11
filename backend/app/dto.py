"""Convert ORM rows into the camelCase payloads the frontend contract expects."""

from __future__ import annotations

from .models import Incident, Station


def incident_to_dict(row: Incident) -> dict:
    return {
        "id": row.id,
        "lat": row.lat,
        "lng": row.lng,
        "category": row.category,
        "occurredAt": row.occurred_at.isoformat(),
        "area": row.area,
        "description": row.description,
        "status": row.status,
        "isDemo": row.is_demo,
    }


def station_to_dict(row: Station) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "lat": row.lat,
        "lng": row.lng,
        "area": row.area,
        "jurisdiction": list(row.jurisdiction or []),
        "isDemo": row.is_demo,
    }
