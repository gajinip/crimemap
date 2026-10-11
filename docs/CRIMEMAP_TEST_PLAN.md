# CRIMEMAP Test Plan

Hackathon audit deliverable - strategy and commands for the isolated QR/QA
workspace and the parallel backend. The existing app is untouched by tests:
all JavaScript tests live under `qa/`, all Python tests under `backend/tests/`.

Companion documents:
[Feature audit](CRIMEMAP_FEATURE_AUDIT.md) | [Architecture review](CRIMEMAP_ARCHITECTURE_REVIEW.md) | [Performance report](CRIMEMAP_PERFORMANCE_REPORT.md) | [Implementation log](CRIMEMAP_IMPLEMENTATION_LOG.md)

## 1. Principles

1. **Quarantine**: no test runner config or dependency is added to the app
   (`root package.json`/`vite.config.ts` untouched). `qa/` owns its own
   `package.json`, `vitest.config.ts`, `playwright.config.ts`.
2. **Test the exposed contract, not the internals**: unit tests import the
   public `src/utils/*` functions; E2E drives the UI through roles/visible
   text; backend tests call the HTTP routes.
3. **Deterministic by construction**: client engines are pure; dates are fixed
   with explicit `+05:30` timestamps; the model artifact is only asserted when
   present.
4. **Skip, don't fake, environment gaps**: database-backed tests skip cleanly
   when PostgreSQL/PostGIS is down.

## 2. Layers

| Layer | Runner | Location | Scope |
| --- | --- | --- | --- |
| Unit (utils) | Vitest | `qa/unit/*.test.ts` | `geo`, `severity`, `filters`, `stats` pure functions |
| E2E | Playwright | `qa/e2e/*.spec.ts` | app boot, nav, map, filters |
| Backend unit | pytest | `backend/tests/test_analytics.py`, `test_ingest.py`, `test_ml.py` | engines, validation, forecast |
| Backend API | pytest | `backend/tests/test_api.py` | HTTP routes, health, ingest (DB-gated) |
| Load | Locust | `qa/load/locustfile.py` | nominal + spike scenarios |

## 3. Commands

```powershell
# one-time browser installation (already performed on this machine)
cd qa
npx playwright install chromium

# unit
npm --prefix qa run test:unit

# e2e (starts the Vite dev server on 127.0.0.1:5173 automatically)
cd qa
npx playwright test

# backend
cd backend
python -m pytest -q

# load
locust -f qa/load/locustfile.py --host http://localhost:5173   # frontend
locust -f qa/load/locustfile.py --host http://localhost:8000    # backend
```

## 4. Coverage map (feature -> test)

| Feature / behaviour | Test(s) |
| --- | --- |
| Map renders bundled incidents | `qa/e2e/app.spec.ts` (leaflet overlay path count) |
| View navigation | `qa/e2e/app.spec.ts` (Dashboard / Crime Map / More menu) |
| Area filter narrows without switching views | `qa/e2e/app.spec.ts` |
| Great-circle distance / centroid / bounds / point-in-polygon + holes | `qa/unit/geo.test.ts` |
| Category->severity map and weights | `qa/unit/severity.test.ts` |
| Filters: category/severity/status/area/search/date | `qa/unit/filters.test.ts` |
| Analytics: range compare, rolling trend, dashboard aggregates, category/monthly/area/status series | `qa/unit/stats.test.ts` |
| Risk zone scoring bounds/ranking/emerging flag (backend) | `backend/tests/test_analytics.py` |
| Change detection, recommendations, patrol plan | `backend/tests/test_analytics.py` |
| Ingest validation + dedupe + bundled dataset integrity | `backend/tests/test_ingest.py` |
| Forecast heuristic + trained-artifact swap | `backend/tests/test_ml.py` |
| Health/root endpoints; ingest + read round-trip (DB) | `backend/tests/test_api.py` |

## 5. Environment matrix

| Layer | Node 24 (Windows) | Python 3.13 | PostgreSQL 17 + PostGIS 3.x |
| --- | --- | --- | --- |
| Vitest | required | - | - |
| Playwright Chromium | required | - | - |
| pytest analytics/ingest/ml | - | required | optional |
| pytest API/Db tests | - | required | required |
| Backend (`uvicorn`) | - | required | required |

## 6. Known risks / accepted gaps

- **No component tests**: the view components (`src/views`, `src/components`)
  are covered only indirectly by E2E; the quarantine constraint forbids adding
  a component test stack.
- **Snapshots**: none captured; dates and generated-at timestamps make them
  brittle, and E2E asserts behaviour instead.
- **The model is methodology-only**: metrics are reported against synthetic
  data and must be re-baselined on real data before operational use.
- **Two documented app quirks** are pinned by tests rather than "fixed":
  `buildMonthlySeries` emits a leading zero month (timezone rollback) and
  `ringSignedArea`'s documented sign convention is reversed. Both are noted
  in `qa/unit/stats.test.ts` and `qa/unit/geo.test.ts`.