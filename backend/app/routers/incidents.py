"""Incident endpoints with filtering, bbox and pagination."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from geoalchemy2.functions import ST_MakeEnvelope
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..dto import incident_to_dict
from ..models import Incident

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("")
def list_incidents(
    db: Session = Depends(get_db),
    area: str | None = None,
    category: str | None = None,
    status: str | None = None,
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
    min_lng: float | None = None,
    min_lat: float | None = None,
    max_lng: float | None = None,
    max_lat: float | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> dict:
    stmt = select(Incident)
    if area:
        stmt = stmt.where(Incident.area == area)
    if category:
        stmt = stmt.where(Incident.category == category)
    if status:
        stmt = stmt.where(Incident.status == status)
    if date_from:
        stmt = stmt.where(Incident.occurred_at >= f"{date_from}T00:00:00+05:30")
    if date_to:
        stmt = stmt.where(Incident.occurred_at <= f"{date_to}T23:59:59+05:30")
    if None not in (min_lng, min_lat, max_lng, max_lat):
        envelope = ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        stmt = stmt.where(Incident.geom.ST_Intersects(envelope))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(Incident.occurred_at.desc()).limit(limit).offset(offset)
    ).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [incident_to_dict(row) for row in rows],
    }
