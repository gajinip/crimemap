# CRIMEMAP — Feature Audit

**System:** CRIMEMAP — Geospatial Crime Intelligence, Analytics & Decision-Support System
**Core concept audited:** MAP → ANALYSE → PREDICT → PREVENT
**Audit date:** 2026-10-11
**Repository:** `C:\Users\asus\OneDrive\Desktop\crimemap`
**Audited revision:** commit `940fd04` (rollback baseline tagged `rollback-baseline` = `9b7a19d`)
**Method:** static inspection of all source files with `file:line` evidence; `npm run lint`; `npm run build`. No runtime data source external to the repo exists to test against.

> **Scope reality.** This is a client-side React single-page application with bundled **synthetic** data. There is no backend, database, authentication, live police-system integration, or automated test suite in the repository. Statuses below reflect what is actually implemented, not what the UI suggests.

## Status legend

| Status | Meaning |
|---|---|
| VERIFIED | Implemented and exercised by the running app |
| PARTIAL | Some functionality works |
| UI ONLY | Visible but not connected to functional logic |
| MOCK DATA | Works only with synthetic/sample data |
| MISSING | Not implemented |
| BLOCKED | Requires unavailable credentials, services, or datasets |

## Baseline build evidence

| Check | Result |
|---|---|
| `npm run lint` (oxlint) | Clean, 0 diagnostics |
| `npm run build` (`tsc -b && vite build`) | Pass — 2007 modules; JS 672.78 kB (gzip 179.54 kB), CSS 66.28 kB (gzip 16.15 kB); 1.38 s |
| Automated tests | MISSING — no runner, no test files, no CI, no Docker, no coverage |
| Backend / DB | MISSING — only reference stubs in `src/services` |

---

## 3.1 Interactive geospatial mapping

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Interactive map render / zoom / pan | VERIFIED | `src/components/map/CrimeMap.tsx:349-362` MapContainer with `scrollWheelZoom/dragging/touchZoom`, `minZoom 11 maxZoom 18` | Leaflet 1.9 + react-leaflet 5 (`package.json:13-17`) | Manual; no automated test | None |
| 2 | Marker selection & detail | VERIFIED | Click handlers open React bottom sheets: `src/components/map/CrimeMarker.tsx:18-28`; `src/views/MapView.tsx:138-146` | — | Manual | Cluster-only popups (`ClusterLayer.tsx:173-183`) vs sheets elsewhere — minor inconsistency |
| 3 | Accurate coords / validation | PARTIAL | Leaflet order correct `src/components/map/CrimeMarker.tsx:23`; but no lat/lng range/finiteness guard before render — a NaN passes straight to Leaflet | Data generated in-boundary (`scripts/generate-demo-data.mjs:204-214`) | Manual | Add coordinate validation at ingestion and render |
| 4 | Invalid/missing location handling | PARTIAL | NaN **dates** are guarded (`src/utils/filters.ts:15`, `src/analytics/risk.ts:64,69,187`) but NaN coordinates are not | — | Manual | Validate/repair coordinates; drop or flag invalid records |
| 5 | Category visualisation | VERIFIED | `src/utils/crimeMapIcon.ts:71-98`; colors `src/utils/visuals.ts:3-11` | Category field | Manual | None |
| 6 | Severity visualisation | PARTIAL | Severity is derived 1:1 from category (`src/utils/severity.ts:7-15`); pins encode **category, not severity** | — | Manual | Encode severity separately if required |
| 7 | Filters: date/category/severity/location | VERIFIED | `src/components/FilterPanel.tsx:129-299`, `src/components/AreaDatePanel.tsx:119-158`, `src/utils/filters.ts:11-63` | — | Manual | — |
| 8 | Station filter | MISSING | No station field in `CrimeFilterState` (`src/types/index.ts:294-302`); none in filter UI | — | — | Add station/jurisdiction filter |
| 9 | Filter sync map↔charts↔tables↔KPI | MISSING (by design) | Map filters isolated: `src/App.tsx:109-112`; charts/KPIs/tables use the full dataset `src/App.tsx:159-166` vs map `src/App.tsx:177-217` | — | Manual | Reconcile or document the deliberate separation |
| 10 | Marker clustering | PARTIAL | Custom area-label grouping below zoom 15: `src/components/map/ClusterLayer.tsx:15,41-80,120-130`; not DBSCAN/supercluster/kdbush | — | Manual | Replace with a spatial cluster structure if density grows |
| 11 | Viewport-based loading / pagination | MISSING | Whole dataset loaded once `src/services/crimeApi.ts:25-32`; no bbox/limit/offset; cluster popup says "N incidents in view" but grouping is over all filtered incidents `ClusterLayer.tsx:175` | — | — | Add bbox query + paging; fix popup wording |
| 12 | Tile config / attribution | VERIFIED | `src/components/map/CrimeMap.tsx:365-382` (OSM + OSM HOT with attribution) | OpenStreetMap tiles | Manual | — |
| 13 | Tile load failure / offline state | MISSING | No `tileerror`/offline handling; only dataset load errors `src/App.tsx:303-335` | — | — | Add tile error fallback + offline notice |
| 14 | CRS / GeoJSON order | VERIFIED | WGS84/EPSG:4326 implicit; GeoJSON `[lng,lat]` converted at `src/components/map/CrimeMap.tsx:45-46`, `src/utils/geo.ts:179-182` | `src/data/puducherry-boundary.json` | Manual | Asset is a bespoke `{source,note,bbox,outer}` object, not standard GeoJSON — convert for interoperability |
| 15 | Boundary mask / clipping | VERIFIED | Custom: polygon clipping, district outline, `evenodd` mask `src/components/map/CrimeMap.tsx:55-62,459-478`, `src/utils/areaBoundary.ts:16-96` | Boundary GeoJSON | Manual | Remove dead CSS `path.boundary-mask` (`src/index.css:159-167`) that no longer matches class `area-mask` |

**Accessibility (maps):** map container has no `aria-label`/text alternative (`CrimeMap.tsx:349-362`); crime pin has no accessible name (`src/utils/crimeMapIcon.ts:78-88`). Station/patrol markers do (`src/components/map/policeIcon.ts:9`, `src/components/map/PatrolLayer.tsx:22`). **PARTIAL.**

---

## 3.2 Hotspot detection

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Hotspot computed from records | VERIFIED (rules) / MOCK DATA | `computeRiskZones` weighted sum of 6 factors `src/analytics/risk.ts:225-398`; inputs are synthetic `src/data/crimeIncidents.ts` | Synthetic, `isDemo:true` | Manual | — |
| 2 | Detection algorithm (grid/DBSCAN/KDE/spatio-temporal) | MISSING | Grouping is by administrative `area` string label with a mean centroid — no grid, DBSCAN, KDE, or space-time scan `src/analytics/risk.ts:182-206` | — | — | Choose one documented approach (grid aggregate or DBSCAN) |
| 3 | Configurable spatial/temporal thresholds | PARTIAL | Constants hardcoded: `REPEAT_RADIUS_M=250`, `NEARBY_RADIUS_M=3000`, window 7–30 d `src/analytics/risk.ts:32-46` | — | — | Make thresholds configurable |
| 4 | Recalculation after data/filters change | VERIFIED | `useMemo` on filters `src/App.tsx:115,182-185` | — | Manual | — |
| 5 | Minimum sample | MISSING | Any area with ≥1 incident becomes a zone `src/analytics/risk.ts:198-204`; only the frequency normaliser floors at 8 `:385` | — | — | Enforce a documented minimum |
| 6 | Isolated / duplicate coordinates | MISSING | Isolated incidents still score; duplicates within 250 m counted as repeats, no dedupe `src/analytics/risk.ts:295-304` (data currently has 457 unique coords) | — | — | Handle duplicates explicitly |
| 7 | Hotspot vs cluster vs statistically-validated area | PARTIAL | "Hotspot"=scored locality; "cluster"=zoom label grouping (`ClusterLayer.tsx`); **no statistical test** (no Getis-Ord/Moran/KDE/p-value) — wording "statistically meaningful" at `src/analytics/changes.ts:15` | — | — | Add a defensible statistical test or remove statistical claims |

---

## 3.3 Temporal analysis

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Hourly aggregation | VERIFIED | 3-hour blocks `src/analytics/risk.ts:109-134`; hourly histograms `src/analytics/changes.ts:94-99` | — | Manual | — |
| 2 | Daily aggregation / series | MISSING | Only window-count helper `src/utils/stats.ts:18-23` | — | — | Add daily series |
| 3 | Weekly aggregation | MISSING | None | — | — | Add weekly series |
| 4 | Monthly aggregation | VERIFIED | `buildMonthlySeries` with gap-fill `src/utils/stats.ts:126-152` | — | Manual | — |
| 5 | Time-series charts | PARTIAL | Only monthly bars `src/components/Charts.tsx:41-78` | — | Manual | Add daily/hourly charts |
| 6 | Category comparison charts | VERIFIED | `src/components/Charts.tsx:12-35`, `src/utils/stats.ts:113-124` | — | Manual | — |
| 7 | Date-range filtering | VERIFIED | `src/utils/filters.ts:11-17,56-63,99-116` | — | Manual | Note: analysis window clamps to 7–30 d (`risk.ts:32-33,81-101`) |
| 8 | Timezone correctness | PARTIAL | Fixed `+05:30`/`Asia/Kolkata` in engines (`risk.ts:48-70`, `stats.ts:43-44,130-131`); LLM digest uses local `getHours()` (`src/services/assistantApi.ts:72`); monthly keys mix UTC and local (`stats.ts:135-137` vs `:143`) | — | — | Unify TZ handling |
| 9 | Missing-period handling | PARTIAL | Months zero-filled `src/utils/stats.ts:141-151`; no day/week series to fill | — | — | Extend once daily/weekly exist |
| 10 | Chart vs map totals consistency | PARTIAL | Dashboard uses `scopedIncidents` (`App.tsx:151-162`), Trends charts use full `incidents` (`:163-166`), map uses its own filters (`:177-217`); no reconciliation | — | Manual | Single source of truth or visible scope labels |
| 11 | Anomaly detection without causal claims | PARTIAL | Threshold-based `changes.ts` with neutral wording (`src/components/WhatChangedPanel.tsx:81`); no causal claims | — | Manual | — |

---

## 3.4 Incident relationship analysis

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Repeats within areas | VERIFIED | Repeats within 250 m feed the score `src/analytics/risk.ts:294-315` | — | Manual | — |
| 2 | Recurring times / categories | VERIFIED | `peakWindowOf`, `dominantCategoryOf` `src/analytics/risk.ts:109-172` | — | Manual | — |
| 3 | Nearby incidents within configurable distance | PARTIAL | Uses fixed 1500 m `src/utils/relatedIncidents.ts:4`; not configurable | — | Manual | Expose thresholds |
| 4 | Spatiotemporal relationships | VERIFIED | Same category + ≤1500 m + ≤72 h `src/utils/relatedIncidents.ts:7,49-67` | — | Manual | — |
| 5 | Explicit criteria / no causal claim | VERIFIED | Process-and-pattern framing, explicit "not proof of a shared offender" `src/analytics/assistant.ts:587`; comment `src/App.tsx:200-201` | — | Manual | — |
| 6 | Patterns meriting analyst review | VERIFIED | Change signals + related links surfaced in UI | — | Manual | — |

---

## 3.5 Predictive analytics

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Genuine predictive model | MISSING | Deterministic rule-based adjustments only: `src/analytics/prediction.ts:10-28,95-159`; `buildRiskForecast` re-emits measured scores `src/analytics/risk.ts:401-421` | — | — | Train/serve a real model (Phase 2/3) |
| 2 | Training data & target definition | MISSING | None | — | — | Define target (next-window count/area) |
| 3 | Feature engineering | MISSING | Only derived zone fields used `src/analytics/prediction.ts:51-92` | — | — | Build feature pipeline |
| 4 | Training & inference code | MISSING | None | — | — | Implement |
| 5 | Temporal train/test separation | MISSING | None | — | — | Implement |
| 6 | Baseline comparison | MISSING | None | — | — | Compare vs seasonal-naive/historical mean |
| 7 | Model evaluation & calibration | MISSING | `confidence` is a heuristic, explicitly not probability `src/views/PredictiveRiskView.tsx:171` | — | — | Metrics + calibration |
| 8 | Data-leakage risk | MISSING | No model exists yet to assess | — | — | Assess once model exists |
| 9 | Uncertainty & horizon | MISSING | Point estimate only; `horizonDays` accepted but unused `src/services/riskApi.ts:16` | — | — | Add interval + horizon |
| 10 | Drift & retraining | MISSING | None | — | — | Define monitoring/retraining |
| 11 | Rule score not presented as AI | PARTIAL | Labelled engine output, but screen is titled "Predictive Risk" with a "forecast table" shape; `modelVersion` string implies a model `src/analytics/risk.ts:416` | — | Manual | Rename/relabel to avoid implying a model until one exists |

---

## 3.6 Data integration & freshness

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Authorized APIs | BLOCKED | HTTP clients are unwired stubs `src/services/crimeApi.ts:36-53`, `src/services/riskApi.ts:15-31`; default is local `crimeApi.ts:55` | — | — | Requires authorized data source |
| 2 | Database records | MISSING | No DB/ORM in repo | — | — | Phase 2 backend |
| 3 | CSV/Excel upload | MISSING | None | — | — | Optional import path |
| 4 | Manual entry | PARTIAL | `IncidentEditor` exists in map (in-memory only; not persisted) | — | Manual | Persist if required |
| 5 | Periodic sync | MISSING | Static data; regeneration is manual (`scripts/generate-demo-data.mjs`) | — | — | Add sync if live source exists |
| 6 | Clearly labelled synthetic data | VERIFIED | Banner `src/components/DemoBanner.tsx:6-15`; `isDemo:true` on every record; README notice | — | Manual | — |
| 7 | Ingestion / update / last-update / permissions documented | PARTIAL | README documents regeneration; no last-update metadata; no authz | — | — | Add metadata + permissions model |
| 8 | Validation rules | MISSING (runtime) | Generator constrains data at generation time only (`generate-demo-data.mjs:204-214`); no runtime schema validation | — | — | Add validation |
| 9 | Failure handling | PARTIAL | Wrong-placeholder UI errors for dataset (`src/App.tsx:303-335`); assistant falls back gracefully (`src/views/IntelligenceView.tsx:111-118`) | — | Manual | Add retry/backoff |
| 10 | Duplicate detection | MISSING | None | — | — | Implement |
| 11 | Record normalization | PARTIAL | Shallow copy only `src/services/crimeApi.ts:26-32` | — | — | Add canonicalization |
| 12 | Missing/invalid field handling | MISSING | No runtime checks | — | — | Implement |
| 13 | Schema compatibility | PARTIAL | TS interfaces define the contract `src/types/index.ts` | — | — | Version schema |
| 14 | Live police integration claim | VERIFIED (no false claim) | No live integration; README/UI are explicit about synthetic data | — | — | — |

---

## 3.7 Decision-support capabilities

| # | Requirement | Status | Code evidence | Data source | Test evidence | Remaining work |
|---|---|---|---|---|---|---|
| 1 | Hotspot summaries | VERIFIED | `src/components/RiskBreakdown.tsx:15-77`; `src/views/HotspotsView.tsx:103,133` | — | Manual | — |
| 2 | Station-level comparisons | MISSING | `src/views/StationsView.tsx:12-91` lists only; no workload/crime comparison | — | — | Add comparative metrics |
| 3 | Crime trend reports | VERIFIED | `src/components/WhatChangedPanel.tsx:25-134`, `src/analytics/changes.ts:162-198` | — | Manual | — |
| 4 | Historical geographic/temporal analysis | VERIFIED | Trends + hotspots views | — | Manual | — |
| 5 | Patrol-planning assistance | VERIFIED | `src/analytics/recommend.ts:89-198`, `src/analytics/patrol.ts:158-231` | — | Manual | Human-review framing present |
| 6 | Export functionality | VERIFIED | CSV + print `src/utils/export.ts:11-29`, `src/views/ReportsView.tsx:149-175` | — | Manual | CSV formula-injection hardening |
| 7 | Alerts based on thresholds | MISSING | Threshold constants only (`risk.ts:136-153`, `changes.ts:24-29`); no notification system | — | — | Add alerting |
| 8 | Recommendations traceable | VERIFIED | Rationale + components exposed (`recommend.ts:122-127`) | — | Manual | — |
| 9 | Human review retained | VERIFIED | Engine framed as decision support (README, view copy) | — | Manual | — |

---

## 3.8 Frontend, usability & accessibility

| # | Requirement | Status | Code evidence | Test evidence | Remaining work |
|---|---|---|---|---|---|
| 1 | Responsive layouts | PARTIAL | Named breakpoints disabled to force one layout `src/index.css:31-36`; sidebar drawer + stacked panel described in README | Manual | Re-evaluate for tablets/desktop |
| 2 | Navigation & search | VERIFIED | State-driven views (`src/App.tsx:79`), free-text search (`src/components/TopNav.tsx:37-38`) | Manual | Consider URL routing |
| 3 | Filters & buttons work | VERIFIED | FilterPanel / AreaDatePanel | Manual | — |
| 4 | Loading / error / empty / success states | PARTIAL | Dataset loading + error (`src/App.tsx:303-335`); assistant fallback (`IntelligenceView.tsx:111-118`); some empty states in views | Manual | Cover all views |
| 5 | Keyboard accessibility | PARTIAL | Chat Enter/Shift+Enter (`IntelligenceView.tsx:124-128`); map picking is pointer-only and container removes focus ring `src/index.css:100` | Manual | Add keyboard map alternative |
| 6 | Chart/map alternatives | MISSING | No table/text alternative for charts/map | — | Add alternatives |
| 7 | Colour contrast / legibility | PARTIAL | Dark palette; not contrast-audited | — | Run contrast audit |
| 8 | Large-dataset behaviour | PARTIAL | No pagination/virtualization (see 3.1.11); engines O(n²) in places (Phase 5) | — | Benchmark + optimize |
| 9 | Stale/inconsistent state prevention | PARTIAL | Immutability + memoized derivations; three different data scopes (`App.tsx:151-217`) | Manual | Unify scopes |

---

## Cross-cutting findings

1. **No backend or persistence.** All analytics are client-side over 457 synthetic records; HTTP data/risk clients are reference stubs.
2. **Prediction is not a model.** "Predictive Risk" is a deterministic, bounded rule adjustment over the same risk zones; training/eval/calibration/uncertainty/horizon/drift are all absent.
3. **No tests anywhere.** Only `oxlint` + `tsc` exist. No CI, Docker, or coverage.
4. **Security:** the optional live assistant reads `VITE_OPENAI_API_KEY` in the browser and sends it to OpenAI from the client (`src/services/assistantApi.ts:6,142`) — a critical exposure for any real key. No authentication exists. CSV export lacks formula-injection prefix sanitisation (`src/utils/export.ts:3-9`). No PII found in data. See `CRIMEMAP_SECURITY_REVIEW.md` (Phase 6).
5. **Accessibility** is partial: map lacks a text alternative; focus ring is suppressed on the map container.
6. **Data scopes differ** between dashboard, charts and map, so totals can disagree on one screen.

## Requirement roll-up

| Area | VERIFIED | PARTIAL | MISSING / BLOCKED |
|---|---|---|---|
| 3.1 Mapping | render/pan/zoom, selection, category, filters, tiles, CRS, masking | coords, severity, clustering | station filter, cross-view sync, viewport loading, tile errors |
| 3.2 Hotspots | rule scoring, recalculation | thresholds, hotspot-vs-cluster | real detection algorithm, min sample, duplicate handling, statistics |
| 3.3 Temporal | hourly, monthly, category charts, range | charts, TZ, consistency | daily, weekly |
| 3.4 Relationships | repeat/nearby/space-time, no causal claim | configurable distance | — |
| 3.5 Prediction | — | presentation | model, data, features, eval, calibration, uncertainty, horizon, drift |
| 3.6 Data | synthetic labelling | ingestion docs, normalization, schema | live API, DB, upload, sync, validation, dedup |
| 3.7 Decision support | summaries, trends, patrol, exports, traceability | — | station comparison, alerting |
| 3.8 Frontend | nav, filters, search | responsive, states, a11y, large data | chart/map alternatives |

## Verification / testing status

| Check | Status |
|---|---|
| `oxlint` | PASS |
| `tsc -b` type-check | PASS |
| Production build | PASS (chunk >500 kB warning) |
| Unit tests | COULD NOT RUN — no runner present |
| Integration tests | COULD NOT RUN — no backend present |
| E2E tests | COULD NOT RUN — no browser test tooling present |
| Load tests | COULD NOT RUN — no load tooling present |

Tracked in `CRIMEMAP_TEST_PLAN.md` and `CRIMEMAP_PERFORMANCE_REPORT.md`.
