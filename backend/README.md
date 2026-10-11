# CRIMEMAP parallel backend

Additive FastAPI + PostgreSQL/PostGIS service. **The React app does not import
any of this** — it is a separate, demonstrable backend and machine-learning
layer built alongside the untouched SPA (see `docs/CRIMEMAP_ARCHITECTURE_REVIEW.md`).

## Layout

```
backend/
  app/            FastAPI application
    analytics.py  deterministic risk/changes/recommend/patrol engines
    ml.py         forecasting hook (heuristic now, trained model in Phase 3)
    ingest.py     validate + dedupe + persist the synthetic dataset
    models.py     SQLAlchemy + PostGIS geography models
    routers/      HTTP endpoints
  data/           extracted JSON (incidents, stations, areas)
  scripts/        extract_demo_data.mjs (regenerates data/ from src/data)
  tests/          pytest suite
```

## Setup

```powershell
cd backend
python -m pip install -r requirements.txt
```

Database (default `postgresql+psycopg2://postgres:postgres@localhost:5432/crimemap`)
is configured via `CRIMEMAP_DATABASE_URL` or a `.env` file (see `.env.example`).

## Run

```powershell
# create schema + enable PostGIS (requires a running PostgreSQL)
python -m app.bootstrap

# load the demo dataset
python -m app.ingest        # or POST /admin/ingest once the API is up

# serve
uvicorn app.main:app --reload --port 8000
```

## Test

```powershell
cd backend
python -m pytest -q
```

Analytics/validation/forecast tests run without a database; database-backed
tests skip automatically when PostgreSQL/PostGIS is unavailable.

## Key endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | service + PostGIS version |
| GET | `/incidents` | filter by area/category/status/date, bbox, paginate |
| GET | `/stations` | police stations |
| GET | `/risk/zones` | explainable risk zones |
| GET | `/risk/forecast` | next-window risk predictions |
| GET | `/changes` | rising / emerging / declining signals |
| GET | `/recommendations` | resource-allocation advice |
| GET | `/patrol/plan` | patrol unit deployment plan |
| GET | `/stats/*` | category / area / monthly / dashboard aggregates |
| POST | `/assistant/ask` | server-side assistant proxy (key stays server-side) |
| POST | `/admin/ingest` | reload and validate the dataset |
