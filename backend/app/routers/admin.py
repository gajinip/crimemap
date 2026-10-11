"""Health and admin endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..db import get_db
from ..ingest import ingest_all

router = APIRouter(tags=["admin"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    try:
        postgis = db.scalar(text("SELECT PostGIS_Version()"))
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "up", "postgis": postgis}
    except Exception as error:  # noqa: BLE001 - health must not raise
        return {"status": "degraded", "database": "down", "detail": str(error)}


@router.post("/admin/ingest")
def ingest(replace: bool = True, db: Session = Depends(get_db)) -> dict:
    return ingest_all(db, replace=replace)
