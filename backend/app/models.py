"""Database models (PostgreSQL + PostGIS).

Geometry is stored as `geography(Point,4326)` so distance/bounding-box filters
use a GiST index rather than scanning. Scalar lat/lng columns are kept for
cheap serialisation and for environments where PostGIS is unavailable.
"""

from __future__ import annotations

from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Float, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    category: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    area: Mapped[str] = mapped_column(String(64), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True
    )
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    geom: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326)
    )

    __table_args__ = (
        Index("ix_incidents_area_occurred", "area", "occurred_at"),
    )


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    area: Mapped[str] = mapped_column(String(64), index=True)
    jurisdiction: Mapped[list[str]] = mapped_column(ARRAY(String(64)), default=list)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    geom: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326)
    )


class Area(Base):
    __tablename__ = "areas"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
