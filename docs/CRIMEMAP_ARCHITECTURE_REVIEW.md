# CRIMEMAP — Architecture Review

**Audit date:** 2026-10-11
**Revision:** `940fd04`
**Related documents:** `CRIMEMAP_FEATURE_AUDIT.md`, `CRIMEMAP_COMPLEXITY_ANALYSIS.md`, `CRIMEMAP_SECURITY_REVIEW.md`

## 1. Existing stack (verified)

| Layer | Technology | Evidence |
|---|---|---|
| Language | TypeScript ~6.0 (strict), ES modules | `package.json:28`, `tsconfig*.json` |
| UI | React 19 + react-dom 19 | `package.json:15-16` |
| Build/dev | Vite 8 + `@vitejs/plugin-react` 6 | `package.json:25,29`, `vite.config.ts:6-8` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | `package.json:20,27`, `vite.config.ts:1-7` |
| Mapping | Leaflet 1.9 + react-leaflet 5 (`divIcon`/`CircleMarker`, OSM tiles) | `package.json:13,17`, `src/components/map/CrimeMap.tsx:365-382` |
| Icons | lucide-react | `package.json:14` |
| Lint | oxlint | `package.json:9`, `.oxlintrc.json` |
| Analytics | Custom deterministic client-side engines | `src/analytics/*` |
| State | Local React state in `App.tsx`; no router, no global store | `src/App.tsx:79-86` |
| Data | Bundled synthetic TS modules + OSM boundary JSON | `src/data/*`, `src/services/crimeApi.ts:25-32` |
| Deploy | Vercel config present | `.vercel/` |

**Data flow:** `index.html` → `src/main.tsx` → `App.tsx` → `crimeDataSource` (local demo) → global dataset + map dataset → `src/analytics/*` engines → views (`src/views/*`) → map/chart/table components. No network on the hot path.

## 2. Assessment

**Strengths**
- Clean separation: UI depends on `src/services` contracts and `src/types`; engines are pure functions.
- Explainable, deterministic scoring (every factor itemised).
- Honest synthetic-data labelling throughout.
- Light, fast build; no heavyweight dependencies.

**Weaknesses / risks**
- No backend, persistence, auth, tests, CI, or observability.
- Rule-based scores presented under a "Predictive Risk" surface (misleading without a model).
- `VITE_OPENAI_API_KEY` exposed client-side (`src/services/assistantApi.ts:6,142`).
- Algorithms contain O(n²)/O(B²) loops (see complexity doc).
- Three inconsistent data scopes across views; total non-reconciliation.
- Accessibility and responsive breakpoints incomplete.

## 3. Recommended stack (additive, parallel)

The application remains untouched. A **separate, parallel service** provides the data/analytics/ML layer the brief expects and is validated independently. This satisfies "audit + real backend + genuine model" without altering existing behavior.

| Layer | Recommended | Why |
|---|---|---|
| Analytics/API | **Python 3.13 + FastAPI + Uvicorn** | Already installed; typed, async, ideal for geospatial/ML interop |
| Database | **PostgreSQL 17 + PostGIS** | Mature spatial types, GiST indexes, distance/bbox queries done near the data |
| DB access | **SQLAlchemy 2 + GeoAlchemy2**, `psycopg` 3 | Already installed; typed models map to `src/types` |
| Analytics | **NumPy + pandas** (already installed) | Feature aggregation for ML and aggregates |
| ML | **scikit-learn** (already installed) | Next-window count regression, temporal split, calibration |
| Charts/frontend | **keep Recharts-free custom charts / keep Leaflet** | No reason to change working UI |
| Tests | **pytest** (backend), **Vitest + Playwright** (isolated `qa/`) | Matches the brief's tooling |
| Load | **Locust** | k6 not installed; Locust is Python-native |

## 4. Alternatives considered (decision matrix)

Scored 1 (poor) – 5 (excellent) for each criterion.

| Option | Impl. simplicity | Performance | Spatial queries | Data processing | Deploy cost | Maintenance | Scalability | Fit with repo | Decision |
|---|---|---|---|---|---|---|---|---|---|
| **Keep client-only (status quo)** | 5 | 3 | 1 | 2 | 5 | 5 | 2 | 5 | Rejected as *sole* target — cannot provide DB/ML/validation the brief requires |
| **FastAPI + PostGIS (parallel)** | 3 | 4 | 5 | 5 | 3 (local) | 3 | 4 | 4 | **Recommended** |
| Next.js (SSR) | 3 | 4 | 1 | 1 | 3 | 3 | 4 | 2 | Rejected — app is a client SPA; SSR adds cost with no requirement |
| Node/TypeScript backend | 4 | 4 | 3 | 2 | 4 | 3 | 4 | 5 | Rejected — weaker geospatial + ML ecosystem than Python |
| Separate Python ML microservice | 2 | 4 | 4 | 5 | 2 | 2 | 4 | 3 | Rejected early — modular monolith until measured need |
| SQLite + SpatiaLite | 5 | 3 | 3 | 2 | 5 | 4 | 1 | 4 | Rejected — weaker spatial parity and concurrency; user chose PostGIS |

**Mapping alternatives**

| Option | Verdict |
|---|---|
| Leaflet (current) | **Keep** — simple, working, sufficient at this data scale |
| MapLibre GL JS | Rejected — vector-tile hosting adds infra for no measured benefit |
| deck.gl | Rejected — GPU layer unnecessary at 457 (and even 10⁵ point) scale with clustering |
| Marker clustering lib (supercluster/kdbush) | Consider — replace custom grouping only if profiling shows a need |

**Charting alternatives**

| Option | Verdict |
|---|---|
| Custom charts (current) | **Keep** — no dependency, adequate |
| Recharts | Rejected — adds weight; no requirement unmet |
| Apache ECharts | Rejected — overkill for current chart set |

**Infrastructure explicitly rejected (with reasons)**

| Technology | Verdict | Reason |
|---|---|---|
| Redis | Rejected | No caching/rate-limit/queue workload measured; adds an operational service |
| Kubernetes | Rejected | Single container/local process is sufficient |
| Message broker (Kafka/RabbitMQ) | Rejected | No streaming ingestion requirement |
| Microservices | Rejected | Modular monolith is the correct starting point |
| Separate ML platform | Rejected | scikit-learn in-process is sufficient |

## 5. Proposed target architecture (parallel)

```
React SPA (unchanged)                 FastAPI service (new, parallel)
  src/**  ----------------X (not wired)  app/
  services/*  (stubs)                     routers/   incidents, stations, risk,
                                          changes, recommend, patrol, stats, assistant
                                        ml/          features -> train -> evaluate -> serve
                                        ingest/      validate, dedupe, normalise
                                        db.py        SQLAlchemy + GeoAlchemy2
                                                 |
                                        PostgreSQL 17 + PostGIS
                                          geography(Point,4326), GiST/btree/composite,
                                          materialized views
```

The SPA is **not** modified. The backend exposes the exact shapes in `src/types/index.ts` so a future, separately-approved integration is a one-line swap (`src/services/crimeApi.ts:12`).

## 6. Migration cost (if integration were later approved)

| Step | Effort | Risk |
|---|---|---|
| Implement backend routers matching `src/types` | Medium | Low (contract already typed) |
| Ingest + validate synthetic set | Low | Low |
| Move risk/aggregation server-side | Medium–High | Medium (must match client outputs) |
| Switch `crimeDataSource` to HTTP | Low | Low |
| Proxy the assistant (fix key exposure) | Low | Low |

## 7. Non-goals

- No rewrite of the React app.
- No introduction of Redis/Kubernetes/broker/microservices.
- No change to the existing client-side analytics behavior.

## 8. Decision summary

- **Keep** the existing React + Vite + Leaflet SPA unchanged.
- **Add** a parallel FastAPI + PostgreSQL/PostGIS + scikit-learn service, independently tested.
- **Reject** SSR, alternative map/chart libraries, and all extra infrastructure as unjustified at the current scale and requirements.
