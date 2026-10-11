"""Aggregate statistics endpoints (server-side equivalents of src/utils/stats.ts)."""

from __future__ import annotations

from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..analytics import parse_dt
from ..config import settings
from ..db import get_db
from ..repository import load_incidents

router = APIRouter(prefix="/stats", tags=["stats"])

MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


def _in_range(incident: dict, date_from: str, date_to: str) -> bool:
    dt = parse_dt(incident.get("occurredAt", ""))
    if dt is None:
        return False
    return date_from <= dt.strftime("%Y-%m-%d") <= date_to


@router.get("/categories")
def stats_categories(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> list[dict]:
    incidents = [i for i in load_incidents(db) if _in_range(i, date_from, date_to)]
    total = len(incidents)
    counts = Counter(i["category"] for i in incidents)
    return [
        {"category": cat, "count": count, "share": (count / total if total else 0.0)}
        for cat, count in counts.most_common()
    ]


@router.get("/areas")
def stats_areas(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> list[dict]:
    incidents = [i for i in load_incidents(db) if _in_range(i, date_from, date_to)]
    counts = Counter(i["area"] for i in incidents)
    return [
        {"area": area, "count": count}
        for area, count in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]


@router.get("/monthly")
def stats_monthly(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> list[dict]:
    incidents = load_incidents(db)
    counts: Counter[str] = Counter()
    for incident in incidents:
        dt = parse_dt(incident.get("occurredAt", ""))
        if dt is None:
            continue
        key = dt.strftime("%Y-%m")
        if date_from[:7] <= key <= date_to[:7]:
            counts[key] += 1

    start = datetime.fromisoformat(f"{date_from}-01")
    end = datetime.fromisoformat(f"{date_to}-01")
    series: list[dict] = []
    year, month = start.year, start.month
    while (year, month) <= (end.year, end.month):
        key = f"{year:04d}-{month:02d}"
        series.append({"month": key, "label": MONTH_LABELS[month - 1], "count": counts.get(key, 0)})
        month += 1
        if month > 12:
            month = 1
            year += 1
    return series


@router.get("/dashboard")
def stats_dashboard(
    db: Session = Depends(get_db),
    date_from: str = Query(default=settings.default_range_from, alias="from"),
    date_to: str = Query(default=settings.default_range_to, alias="to"),
) -> dict:
    incidents = [i for i in load_incidents(db) if _in_range(i, date_from, date_to)]
    counts = Counter(i["category"] for i in incidents)
    most_common = counts.most_common(1)
    return {
        "totalIncidents": len(incidents),
        "mostCommonCategory": most_common[0][0] if most_common else None,
        "mostCommonCount": most_common[0][1] if most_common else 0,
        "byStatus": dict(Counter(i["status"] for i in incidents)),
    }
