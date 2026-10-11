"""FastAPI application entry point.

Run with:  uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, assistant, incidents, ops, risk, stats, stations


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        from .bootstrap import init_schema

        init_schema()
    except Exception:  # noqa: BLE001 - API must boot without a database
        pass
    yield


app = FastAPI(title=settings.app_name, version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (admin, incidents, stations, risk, ops, stats, assistant):
    app.include_router(module.router)


@app.get("/")
def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs", "health": "/health"}
