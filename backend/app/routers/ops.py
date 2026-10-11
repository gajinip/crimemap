"""Operational decision-support endpoints: changes, recommendations, patrol."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..analytics import (
    build_patrol_plan,
    build_recommendations,
    compute_risk_zones,
    detect_changes,
)
from ..config import settings
from ..db import get_db
from ..repository import load_incidents, load_stations

router = APIRouter(tags=["operations"])


@router.get("/changes")
def changes(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> dict:
    incidents = load_incidents(db)
    return detect_changes(incidents, date_from, date_to).model_dump()


@router.get("/recommendations")
def recommendations(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> list[dict]:
    incidents = load_incidents(db)
    zones = compute_risk_zones(incidents, date_from, date_to)
    stations = load_stations(db)
    return [r.model_dump() for r in build_recommendations(zones, stations)]


@router.get("/patrol/plan")
def patrol_plan(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> dict:
    incidents = load_incidents(db)
    zones = compute_risk_zones(incidents, date_from, date_to)
    stations = load_stations(db)
    recs = build_recommendations(zones, stations)
    generated_at = datetime.now(timezone.utc).isoformat()
    return build_patrol_plan(zones, stations, recs, generated_at).model_dump()
