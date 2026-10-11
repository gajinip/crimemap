"""HTTP smoke tests.

Uses httpx's ASGI transport directly (the bundled TestClient is incompatible
with the installed httpx/starlette versions). Database-backed checks skip when
PostgreSQL/PostGIS is not reachable or when tables cannot be created.
"""

from __future__ import annotations

import asyncio

import httpx
import pytest
from sqlalchemy import text

from app.bootstrap import init_schema
from app.db import get_engine
from app.main import app


def _db_available() -> bool:
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001
        return False


def _schema_available() -> bool:
    if not _db_available():
        return False
    try:
        init_schema()
        return True
    except Exception:  # noqa: BLE001
        return False


DB_UP = _schema_available()

db_required = pytest.mark.skipif(not DB_UP, reason="PostgreSQL/PostGIS not reachable")


def request(method: str, url: str, **kwargs) -> httpx.Response:
    async def run() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, url, **kwargs)

    return asyncio.run(run())


def test_root_available():
    response = request("GET", "/")
    assert response.status_code == 200
    assert "service" in response.json()


def test_health_never_raises():
    response = request("GET", "/health")
    assert response.status_code == 200
    assert response.json()["status"] in {"ok", "degraded"}


@db_required
def test_ingest_then_query():
    ingest = request("POST", "/admin/ingest")
    assert ingest.status_code == 200
    assert ingest.json()["inserted"] > 0

    incidents = request("GET", "/incidents", params={"limit": 5})
    assert incidents.status_code == 200
    body = incidents.json()
    assert body["total"] > 0
    assert len(body["items"]) <= 5


@db_required
def test_risk_and_patrol_endpoints():
    request("POST", "/admin/ingest")
    zones = request("GET", "/risk/zones")
    assert zones.status_code == 200
    assert isinstance(zones.json(), list)

    plan = request("GET", "/patrol/plan")
    assert plan.status_code == 200
    assert len(plan.json()["units"]) <= 6
