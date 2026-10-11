# CRIMEMAP - Presentation Dossier

**One-liner:** A geospatial Crime Intelligence, Analytics & Decision-Support dashboard for Puducherry, India - a React/TypeScript SPA plus a parallel FastAPI/PostGIS backend and ML layer. All data is **synthetic demo data**.

> Note: every number, zone and recommendation in the app is generated from a seeded synthetic dataset. Nothing here reflects real crime.

---

## 1. High-level architecture

```
+---------------------------- FRONTEND (React 19 + Vite 8 + TS 6) ----------------------------+
|  App.tsx (state + view switch)                                                              |
|   |- DemoBanner (ticker)  |- TopNav (search)  |- <main> view  |- BottomNav                  |
|   |- views/*  (9 screens)                          |- components/* (ui, map, risk)          |
|   |- analytics/* (risk->changes->prediction->recommend->patrol->assistant)  deterministic   |
|   |- patrol/* (PatrolProvider context + simulation)                                          |
|   |- services/* (CrimeDataSource, RiskApiService, assistantApi)  <-- data boundary          |
|        default = localDemoCrimeSource (457 incidents, 11 stations, 20 areas)                 |
+---------------------------------------------------------------------------------------------+
        (NOT imported at runtime)                    contracts intentionally mirror each other
+-------------------------- BACKEND (FastAPI + PostgreSQL/PostGIS, additive) ------------------+
|  app/main.py -> routers: incidents, stations, risk, ops, stats, assistant, admin             |
|  analytics.py (same 6-factor engine) . ml.py/train.py (Ridge forecast) . ingest.py           |
|  models.py: incidents / stations / areas (PostGIS geography Point,4326)                       |
|  data/*.json (extracted from frontend TS via scripts/extract_demo_data.mjs)                    |
+---------------------------------------------------------------------------------------------+
```

**Key truth:** the React app does **not** import the backend. The backend is a demonstration/portability layer that mirrors the frontend's TypeScript contracts (camelCase DTOs) so it can be swapped in later without UI changes.

---

## 2. Tech stack

### Frontend

| Area | Technology | Version |
|---|---|---|
| UI | React / React-DOM | ^19.2.8 |
| Build | Vite + @vitejs/plugin-react | ^8.3.0 / ^6.1.1 |
| Language | TypeScript | ~6.0.2 (strict, `tsc -b`, `noUnusedLocals`, `verbatimModuleSyntax`) |
| Styling | Tailwind CSS v4 (+ `@tailwindcss/vite`) | ^4.3.3 |
| Maps | Leaflet + react-leaflet | ^1.9.4 / ^5.0.0 |
| Icons | lucide-react (+ Tabler Icons webfont via jsDelivr) | ^1.53.0 |
| Lint | oxlint | ^1.81.0 |
| QA (separate package) | Vitest + Playwright | `qa/` |

### Backend

| Dependency | Version | Role |
|---|---|---|
| fastapi | 0.115.6 | Web framework, routers, DI |
| uvicorn[standard] | 0.34.0 | ASGI server |
| SQLAlchemy | 2.0.43 | ORM |
| GeoAlchemy2 | 0.20.0 | PostGIS `Geography(POINT,4326)` |
| psycopg2-binary | 2.9.10 | PostgreSQL driver |
| pydantic / pydantic-settings | 2.9.2 / 2.10.1 | Schemas / env config |
| scikit-learn | 1.7.2 | Ridge/GBM/RF forecasting |
| numpy / pandas | 2.3.3 / 2.3.2 | Numerics / frames |
| joblib | 1.5.2 | Model persistence |
| pytest / httpx | 9.1.1 / 0.28.1 | Tests / OpenAI client |
| shapely | 2.2.0 | Geometry support |

---

## 3. Frontend deep dive

### 3.1 App shell and state (`src/App.tsx`, 468 lines)

- **No router, no Redux/Zustand.** Navigation is a manual `AppView` string switch; `PatrolProvider` is the only React context.
- State owned here: `view` (default `map`), `filters` (`CrimeFilterState`), `viewRange`, `data { incidents, stations }`, `selection { id, area }`, `generatedAt`.
- **Two datasets:** a *global* one (all views) and a *map-scoped* one (map filters never mutate other views).
- On load: `Promise.all([crimeDataSource.fetchIncidents(), fetchStations()])`; loading and error/retry states.
- Callbacks: `focusArea`, `navigate`, `selectZone`/`selectZoneObject`, `updateIncident`/`deleteIncident`/`createIncident`, `resetAllFilters`.
- Related-incident linking: same category, <= 1.5 km, <= 72 h -> pulsing halos on the map.

### 3.2 Screens (`src/views/*`) - every feature

| Screen | Features |
|---|---|
| **Dashboard** | KPI tiles (volume, avg risk, high-risk zones, trend), "What changed?" panel, category + monthly charts, top risk zones, top recommendation, incident table, compare-range selector |
| **Crime Map** | Leaflet on the verified Puducherry boundary; base-layer switch (OSM + HOT); hard viewport lock (`fitBounds`/`maxBounds`, min zoom 11); opaque outside-boundary mask (SVG `evenodd`); category-coloured markers + popups; locality count clusters < zoom 13; score-coloured risk-zone circles (dashed = contained); animated patrol chips (Standby/Deploying/Patrolling); legend + filters; incident sheet/editor; zone detail panel; linked-incident halos |
| **Risk Zones (`HotspotsView`)** | Segmented Active/All filter with live counts; redesigned **RiskZoneCard**: severity badge + icon, `RZ-nn` id, SVG score ring, trend **count difference**, 4-tile stats grid, "View on map"; detail panel with full risk breakdown + recommendation |
| **Crime Trends** | Monthly volume, category distribution, area concentration, case status, zone risk spread, change signals |
| **Intelligence Assistant** | Rule-based Q&A with question chips + cited sources; optional live streaming LLM; analysis-context panel |
| **Predictive Risk** | Forecast table shaped like `GET /api/v1/risk/forecast`; deterministic engine output (labelled "not a model") |
| **Patrol Ops** | Dispatch plan, unit board with live progress/ETA, start/pause/speed/reset |
| **Police Stations** | Station cards, jurisdiction coverage, workload |
| **Reports & Export** | Scoped CSV exports (incidents, zones, change signals, stations) + Print/PDF |

### 3.3 Components

- **ui/**: `Panel`, `StatTile` + `BarRow`, `Badge` (Risk/Category/Status/Trend/DemoChip), `PageHeader`, `InfoPopover` (tap-to-open description popovers).
- **map/**: `CrimeMap`, `CrimeMarker`, `ClusterLayer`, `PoliceStationMarker` + `policeIcon.ts`, `RiskZoneLayer`, `PatrolLayer`, `MapLegend`, `DetailSheet`, `IncidentSheet`, `IncidentEditor`, `PatrolSheet`, `StationSheet`, `ZoneDetailPanel`.
- **risk/**: `RiskScoreRing`, `RiskZoneCard`.
- **root**: `TopNav`, `BottomNav`, `Header`, `ProfileMenu`, `DemoBanner`, `FilterPanel`, `AreaDatePanel`, `StatisticsPanel`, `CrimeTable`, `Charts`, `RiskBreakdown`, `RecommendationCard`, `WhatChangedPanel`.

### 3.4 Analytics engines (`src/analytics/*`) - deterministic, explainable

- **`risk.ts`** - recent vs previous 30-day windows; clusters by locality; score 0-100 across **6 weighted factors**: frequency 30, trend 20, severity 15, repeat-in-250m 15, time-of-day 10, proximity-in-3km 10. Each factor returns points/max/evidence. Levels: Low < 35 <= Medium < 55 <= High < 75 <= Critical.
- **`changes.ts`** - rising (>= 25%), emerging (0 -> N), declining (>= 15%).
- **`prediction.ts`** - conservative capped adjustment from emerging/trend, blended by confidence; keeps measured `baseScore`/`baseLevel`.
- **`recommend.ts`** - priority P1-P3, units (Critical 3 / High 2 / Medium 1), focus window + focus crime, nearest station, rationale.
- **`patrol.ts`** - deterministic dispatch + position/status projection for the simulation clock.
- **`assistant.ts`** - rule-based answers quoting current data only.

### 3.5 Services and data

- **`crimeApi.ts`** - `CrimeDataSource` contract; `localDemoCrimeSource` (default); `httpCrimeDataSource('/api/v1')` reference impl.
- **`riskApi.ts`** - `RiskApiService` + `httpRiskApi` (`GET /api/v1/risk/forecast`).
- **`assistantApi.ts`** - streaming OpenAI-compatible client; env `VITE_OPENAI_API_KEY`, `VITE_OPENAI_MODEL` (default `gpt-4o-mini`).
- **`src/data/`** - `crimeIncidents.ts` (457), `policeStations.ts` (11), `areas.ts` (20), `puducherry-boundary.json` (277-vertex ring). Generator: `scripts/generate-demo-data.mjs` (seeded `mulberry32(20260408)`).

### 3.6 Styling system (`src/index.css`)

- Tailwind v4 `@theme` tokens: navy 950-500, steel 100-600, risk low/med/high/critical (`#22c55e`/`#eab308`/`#f97316`/`#ef4444`), signal blue/cyan.
- **Forced-mobile trick:** `--breakpoint-*: 100000px` (all responsive utilities inert) -> fixed `max-w-[430px]` phone frame.
- Leaflet dark overrides, marker CSS (`.crime-pin`, `.cluster-marker`, `.patrol-marker`), pane z-index layering, animations (`.ticker-track`, `crime-pin-pulse`, `sheet-in`), `prefers-reduced-motion`, `scroll-thin`, safe-area helpers.

### 3.7 Frontend import details

- **External packages used in code:** `react`, `react-dom`, `leaflet`, `react-leaflet`, `lucide-react`. CDN: Tabler Icons webfont. Map tiles: OSM (and HOT).
- **Internal import flow:** components import only `src/types`; data is reached via `src/services/*`; the map boundary JSON is imported directly in `CrimeMap.tsx`.

---

## 4. Backend deep dive

### 4.1 File map (`backend/`)

`app/`: `main.py`, `config.py`, `db.py`, `bootstrap.py`, `models.py`, `schemas.py`, `dto.py`, `repository.py`, `analytics.py`, `ml.py`, `train.py`, `ingest.py`, `routers/{admin,incidents,stations,risk,ops,stats,assistant}.py`; `data/` (incidents/stations/areas JSON); `models/` (`metrics.json`, `risk_model.joblib`); `tests/` (22 tests); `scripts/{dev.ps1, extract_demo_data.mjs}`.

### 4.2 Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` `/health` | banner; liveness + PostGIS version |
| GET | `/incidents` | filter area/category/status/date, bbox, paginate (limit 1-1000) |
| GET | `/stations` | stations |
| GET | `/risk/zones` | explainable zones |
| GET | `/risk/forecast` | next-window predictions (`horizon_days=30`) |
| GET | `/changes` | rising/emerging/declining |
| GET | `/recommendations` | <= 6 allocation advice |
| GET | `/patrol/plan` | 6-unit deployment plan |
| GET | `/stats/{categories,areas,monthly,dashboard}` | aggregates |
| POST | `/assistant/ask` | server-side LLM proxy |
| POST | `/admin/ingest` | reload/validate dataset (`replace=true`) |

### 4.3 Data models (PostGIS)

- **incidents** - `id, category*, status*, area*, description, occurred_at*, is_demo, lat, lng, geom Geography(POINT,4326)`; composite index `(area, occurred_at)`.
- **stations** - `id, name, area*, jurisdiction ARRAY, is_demo, lat, lng, geom`.
- **areas** - `name(PK), lat, lng`. No FKs/relationships (joined by string keys).

### 4.4 Backend analytics (`analytics.py`)

Same 6-factor engine and weights as the frontend, IST timezone, identical thresholds. `detect_changes` (rising >= 25 / emerging / declining >= 15), `build_recommendations` (units Critical 3 / High 2 / Medium 1; P1 >= 75, P2 >= 55), `build_patrol_plan` (6 units, callsigns Echo/Falcon/...).

### 4.5 ML (`ml.py` + `train.py`, `models/metrics.json`)

- Target: **next-window incident count**; 8 features; sliding 30-day windows / 15-day step; temporal 70/30 split.
- Candidates: Ridge, GradientBoosting, RandomForest + baselines (seasonal-naive, historical-mean).
- **Results (177 samples; 118 train / 59 test):** Ridge **MAE 1.704 / RMSE 2.292** (best model) - but the historical-mean baseline scored **1.636 MAE**, i.e. the model does **not** beat the simplest baseline on synthetic data (stated honestly as a methodology demo). Detection POD 0.357 / POFD 0.0; `countScaleP95 8.0`.
- Runtime falls back to a deterministic heuristic if the artifact/env is missing.

### 4.6 Ingest (`ingest.py`)

Validation (id, lat/lng range, category/status enums, area, ISO date) -> dedupe by id -> optional `DELETE` replace -> insert geoms via `WKTElement(POINT(lng lat),4326)` -> commit; returns `IngestReport`.

### 4.7 Assistant proxy (`routers/assistant.py`)

`OPENAI_API_KEY` read **server-side** via `os.environ` (never shipped to the browser); `OPENAI_MODEL` default `gpt-4o-mini`; temperature 0.2. Deterministic **fallback** echoes the client digest when no key/error -> works air-gapped.

### 4.8 Config, tests, security

- Env (`CRIMEMAP_` prefix): `APP_NAME`, `DATABASE_URL` (default `postgresql+psycopg2://postgres:postgres@localhost:5432/crimemap`), `DEFAULT_RANGE_FROM/TO` (`2026-04-01`/`2026-10-08`).
- **22 pytest tests** (analytics 8, ingest 7, api 4, ml 3); DB-backed tests auto-skip without PostGIS.
- **Security notes for the deck:** wide-open CORS, **no auth** (public `POST /admin/ingest`), no rate limiting, no TLS; assistant key kept server-side; parameterized SQL. Fine for a demo - flag as hardening items.

---

## 5. Data and deployment

- **Dataset:** 457 incidents (Theft 101, Vehicle Theft 79, Other 66, Fraud 61, Burglary 58, Assault 50, Robbery 42), 11 stations, 20 areas, 2026-04-01 -> 2026-10-06 IST; all `isDemo: true`.
- **Boundary:** Puducherry Taluk (OSM relation 10088305), 277-point polygon, ODbL.
- **Hosting:** Vercel (project `crimemap`, aliased `https://crimemap-beta.vercel.app`), Deployment Protection on. **Git auto-deploy connected** (push to `main` -> production).

---

## 6. Honesty and known discrepancies (include on risk slide)

- 100% synthetic data - disclaimers on every screen (`DemoBanner`, `isDemo`, `.popup-demo`).
- **`README.md` is stale**: it describes a desktop sidebar, `PuducherryBoundaryMask`/`useCityBoundary`, and `public/geojson/...` that do not exist; the shipped app is the fixed mobile shell importing `src/data/puducherry-boundary.json`.
- The backend is parallel and not wired to the UI; the ML model does not beat the naive baseline on this data.
- No frontend auth; `VITE_OPENAI_API_KEY` (if set) would ship to the browser - the backend proxy is the correct pattern.

---

## 7. Suggested slide flow (12 slides)

1. Title + one-liner
2. Problem / objective
3. Architecture diagram
4. Tech stack
5. Screens tour
6. Risk engine (6 factors)
7. Map features
8. Assistant and predictions (explainability)
9. Backend and endpoints
10. ML results (honest)
11. Data and deployment
12. Security / limitations and roadmap
