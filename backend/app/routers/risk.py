"""Risk-zone and forecast endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..analytics import build_analysis_window, compute_risk_zones
from ..config import settings
from ..db import get_db
from ..ml import forecast_from_zones
from ..repository import load_incidents

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/zones")
def risk_zones(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> list[dict]:
    incidents = load_incidents(db)
    zones = compute_risk_zones(incidents, date_from, date_to)
    return [zone.model_dump() for zone in zones]


@router.get("/forecast")
def risk_forecast(
    db: Session = Depends(get_db),
    horizon_days: int = Query(default=30, alias="horizon_days"),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> dict:
    incidents = load_incidents(db)
    zones = compute_risk_zones(incidents, date_from, date_to)
    return forecast_from_zones(zones, horizon_days=horizon_days)
