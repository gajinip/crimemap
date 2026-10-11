"""Police-station endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..dto import station_to_dict
from ..models import Station

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("")
def list_stations(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Station).order_by(Station.id)).all()
    return [station_to_dict(row) for row in rows]
