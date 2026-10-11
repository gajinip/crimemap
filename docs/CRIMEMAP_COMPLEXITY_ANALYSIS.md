# CRIMEMAP Complexity Analysis

Hackathon audit deliverable - algorithmic complexity of the existing React app,
the parallel backend, and the forecasting model, plus benchmark targets.

Companion documents:
[Feature audit](CRIMEMAP_FEATURE_AUDIT.md) | [Architecture review](CRIMEMAP_ARCHITECTURE_REVIEW.md) | [Security review](CRIMEMAP_SECURITY_REVIEW.md) | [Test plan](CRIMEMAP_TEST_PLAN.md) | [Performance report](CRIMEMAP_PERFORMANCE_REPORT.md)

## Conventions

- `N` = incidents in scope, `A` = areas (localities), `S` = police stations,
  `K` = selected/filtered subset, `M` = model samples.
- Big-O is stated in terms of these. All client engines are pure and run on the
  bundled 457-record demo set, so absolute timings are tiny; complexity matters
  once live feeds arrive.

## 1. Existing React app

### 1.1 Analytics engines (`src/analytics/*`)

These run once per view render and are re-computed whenever the incident set
changes (`App.tsx` recomputes them in `useMemo`).

| Function | Complexity | Notes |
| --- | --- | --- |
| `computeRiskZones` (`src/analytics/risk.ts`) | `O(sum(n_i^2) + A^2)` per area aggregation | `sum(n_i^2)` is the pairwise repeat test (250 m radius); worst case `O(N^2)` when every incident sits in one area. `A^2` is the cross-area "nearby" scan. |
| `detectChanges` (`src/analytics/changes.ts`) | `O(N)` | single pass bucketing by area/window. |
| `buildRiskForecast` (`src/analytics/prediction.ts`) | `O(Z + 1)` | one deterministic readout per zone; no model. |
| `buildDispatchPlan` / `buildPatrolPlan` (`src/analytics/recommend.ts`, `patrol.ts`) | `O(A^2 + Z*S)` | nearest-station scan dominates; trivial at demo scale. |
| `findRelatedIncidents` (`src/utils/relatedIncidents.ts`) | `O(S * P)` | for selected seeds `S` in a pool `P`, same-category within 1.5 km / 72 h. |

### 1.2 Rendering and filters

| Function | Complexity | Notes |
| --- | --- | --- |
| Filters (`src/utils/filters.ts`) | `O(N)` | linear scan with set-based category/severity/status checks. |
| Category/monthly statistics (`src/utils/stats.ts`) | `O(N)` | hash-count then sort constant-sized output. |
| Map markers | `O(N)` Leaflet `CircleMarker`s | one DOM/SVG node per incident; the demo renders 457 markers. |

### 1.3 Hotspot methodology note

"Hotspots / risk zones" are **area-label buckets**, not spatial clusters. There
is no grid, DBSCAN/K-Means, kernel density estimate, or significance test
anywhere in the client (confirmed across `src/analytics/risk.ts`). The risk
score is a weighted, explainable sum of six factors (frequency 30, trend 20,
severity 15, repeat 15, time-of-day 10, proximity 10), which is a defensible
rule-based design for a demo but is an analytical limitation at scale. See the
feature audit sections 3.4-3.5.

## 2. Parallel backend (`backend/`)

Not wired to the SPA; auditable independently.

| Component | Complexity | Notes |
| --- | --- | --- |
| `/incidents` bbox filter | `O(log N + K)` | PostGIS GiST indexed `ST_Intersects(ST_MakeEnvelope(...))`. |
| `/incidents` area/category/date filters | `O(log N + K)` | indexed columns (`area`, `status`, `category`, `occurred_at`). |
| `compute_risk_zones` (`backend/app/analytics.py`) | `O(sum(n_i^2) + A^2)` | identical algorithm to the client so the two can be cross-checked. |
| Ingest (`backend/app/ingest.py`) | `O(N)` | set-based `id` dedupe; `ON DELETE` + bulk `INSERT`. |
| Forecast heuristic (`backend/app/ml.py`) | `O(Z)` | per-zone clamp/readout. |

Observed wall time (457 records, Python 3.13, Ryzen mid-tier laptop):
`compute_risk_zones` -> 20 zones in **~1.9 ms**.

## 3. Forecasting model (`backend/app/train.py`)

| Step | Complexity |
| --- | --- |
| Sample building (sliding 30-day windows, 15-day step) | `O(W * A * N)` for `W` windows, dominated by feature extraction re-running the zone engine per window. |
| Ridge fit | `O(d^2 * M + d^3)` with `d=8` features, `M=177` samples - effectively instant. |
| GBDT / RF fit | `O(M * d * trees * depth)`, seconds at this size. |
| Inference (`/risk/forecast`) | `O(Z * d)` per zone. |

Training runtime for the full 177-sample set is well under a minute; the
bottleneck, if this ever sees real data, is the per-window feature extraction,
not the learners.

## 4. Benchmark targets

Targets are for the **demo/staging** configuration (bundled data, local
PostgreSQL/PostGIS, one laptop). Stretch targets assume a live feed and are
marked "(live)". Numbers are deliberately generous so regressions are easy to
spot without noisy micro-benchmarks.

| Area | Test | Target | Stretch (live) |
| --- | --- | --- | --- |
| Frontend bundle | gzip JS | <= 250 kB | <= 350 kB |
| Frontend build | `npm run build` | <= 5 s | <= 10 s |
| First meaningful paint | dev server + `page.goto` | <= 3 s | <= 2 s |
| Map render | 1,000 markers | <= 500 ms | <= 250 ms (clustered) |
| Filter apply | 10,000 incidents | <= 50 ms | <= 25 ms |
| Risk engine (client or backend) | 10,000 incidents | <= 500 ms | <= 250 ms |
| API `/risk/zones` p95 | local, warm | <= 200 ms | <= 150 ms |
| API bbox query | 100 km^2, 100 k rows | <= 50 ms | <= 30 ms |
| Ingest | 10 k-row JSON reload | <= 10 s | <= 5 s |
| Model training | 10 k samples | <= 120 s | incremental <= 30 s |
| Forecast inference | 100 zones | <= 25 ms | <= 10 ms |

Measured actuals across this program are collected in
[CRIMEMAP_PERFORMANCE_REPORT.md](CRIMEMAP_PERFORMANCE_REPORT.md).

## 5. Known scaling risks

1. **Pinnaire-share hotspots**: the O(N^2) pairwise repeat test is the first
   thing to trip at live scale; replace with a uniform grid or a KD-tree.
2. **Same-window marker render**: every incident becomes a DOM node; cluster at
   >2-3 k incidents.
3. **Per-window feature recomputation** in training: hoist emission of
   per-area/month features into the database (GROUP BY area, window) before any
   grid search.
4. **CORS wildcard on the backend** (`app/main.py`): convenient for the demo,
   wrong for deployment; restrict to the app origin (see security review).