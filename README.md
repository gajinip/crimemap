# CRIMEMAP

**Geospatial Crime Intelligence, Analytics & Decision-Support System**

An interactive police/crime-analysis dashboard focused on Puducherry (Pondicherry), India.
Built with React + TypeScript + Vite, Leaflet / React-Leaflet (OpenStreetMap tiles), Tailwind CSS and lucide-react icons.

> ## ⚠ DEMO DATA — NOT REAL CRIME INFORMATION
> Every incident, police-station record, risk score and forecast in this build is
> **synthetic sample data** generated for interface development. Nothing shown here is a real
> crime report, real victim, real police record or real prediction about people or places.
> The banner and per-popup notices make this visible on every screen.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production bundle
npm run preview    # serve the production bundle
npm run lint       # oxlint
```

Regenerate the synthetic incident dataset (deterministic seed):

```bash
node scripts/generate-demo-data.mjs
```

Regenerate the city boundary from OpenStreetMap (see below):

```bash
node scripts/fetch-puducherry-boundary.mjs
```

## City boundary dataset

The map is cropped to a real, verifiable administrative boundary, loaded from the
local project at `public/geojson/puducherry-city-boundary.geojson`.

| | |
| ----------------- | --- |
| **Dataset** | OpenStreetMap relation [10088305](https://www.openstreetmap.org/relation/10088305) — "Puducherry Taluk" |
| **Boundary type** | Administrative **revenue sub-district (taluk)**, OSM `admin_level=6` — the Puducherry city/enclave and its immediate surroundings |
| **Geometry** | `Polygon`, 475 vertices, valid and closed, EPSG:4326 (WGS84), `[lng, lat]` order |
| **Retrieval** | `2026-10-09`, via the Nominatim lookup API (`polygon_geojson=1`); regenerable with `scripts/fetch-puducherry-boundary.mjs` |
| **Licence** | Open Data Commons Open Database License (**ODbL 1.0**) |

> **Boundary choice / limitation.** The exact **Puducherry Municipality** corporate
> limits (19.46 km², 33 wards) are *not* published as open geospatial data — the
> Government of Puducherry Local Administration Department only publishes map
> images. The nearest verifiable open administrative boundary for the city is
> therefore the **Puducherry Taluk** (revenue sub-district), which covers the
> Puducherry city/enclave core. It is **not** the municipal corporation boundary and
> is **not** the whole Union Territory (`admin_level=4`) or district (`admin_level=5`),
> both of which were explicitly rejected as too broad. No coordinates were invented.

The boundary is requested once and cached for the page lifetime; it is never
re-fetched on map re-render.

## Screens

| Sidebar entry      | Contents |
| ------------------ | -------- |
| Dashboard          | KPI tiles (volume, average risk score, high-risk zones, trend), **⚡ What changed?** panel, category/monthly charts, top risk zones, top recommendation, incident table |
| Crime Map          | Leaflet map framed on the verified Puducherry city boundary (`fitBounds`), floating filters, risk-zone layer, animated patrol units, locality clustering, zone detail panel, opaque outside-boundary mask |
| Hotspots           | Emerging-hotspot register: score, level, recent/prev counts, peak window + explainable risk breakdown and recommendation for the selected zone |
| Crime Trends       | Monthly volume, category distribution, area concentration, case status, zone risk spread |
| Intelligence       | Focused rule-based assistant (question chips, cited sources) + analysis context |
| Predictive Risk    | Risk forecast table shaped like the future `/api/v1/risk/forecast` response — **deterministic engine output, no model runs** |
| Patrol Simulation  | Dispatch plan, unit board with live progress/ETA, start/pause/speed/reset controls |
| Police Stations    | Station cards with jurisdiction coverage and workload |
| Reports            | Scoped CSV exports (incidents, risk zones, change signals, stations) |

## Map features

- OpenStreetMap standard tiles + OSM Humanitarian (HOT) base-layer switch
- **Hard viewport lock to the Puducherry city area**: the camera is framed on the
  verified boundary with `fitBounds`, pan/zoom rubber-bands at the boundary's
  bounding box (`maxBounds` + `maxBoundsViscosity = 1`) and minimum zoom 11 — the
  camera can never leave the operation area
- Toggleable **"Puducherry boundary" overlay (on by default)**: a dashed
  city-boundary outline plus a dark, **opaque mask over everything outside the
  boundary** (`PuducherryBoundaryMask`), so the basemap is visible only inside the
  real geographic outline. The mask renders in Leaflet's overlay pane — above the
  tiles and other vector overlays, below markers and popups — and uses the SVG
  `evenodd` fill rule with the boundary rings as holes, which correctly handles
  `Polygon` and `MultiPolygon` geometries, disconnected enclaves and interior holes
- **Boundary clipping**: incident, police-station and patrol point features are
  filtered with a point-in-polygon test against the boundary; extended vector shapes
  (risk-zone circles) are clipped visually because the mask is painted above them.
  The underlying datasets are never modified
- Independently toggleable layers: incidents, risk zones, police stations, patrol units
- Category-coloured incident markers with detailed popups; localities collapse into
  **count clusters below zoom 13** and split back into markers when you zoom in
- Score-coloured risk zones (`risk score, level, trend, peak window, dominant crime, radius`)
  with dashed outline for contained zones; clicking a zone opens the analysis panel
- Animated **simulated patrol chips** (Standby / Deploying / Patrolling) driven by the
  patrol simulation clock
- Zoom controls, scale control, area-based camera fly-to, collapsible legend and filter panel

## Filters & risk taxonomy

- Categories: Theft, Robbery, Assault, Burglary, Vehicle Theft, Fraud, Other
- Severity: Low, Medium, High, Critical (mapped from the category)
- Incident status: Reported, Under Investigation, Closed
- Zone risk level: Low, Medium, High, Critical
- Time presets: 7D / 30D / 90D / ALL, plus locality selector, free-text search and
  date-range selector in the header

## Risk engine (client-side, deterministic)

`src/analytics/` turns the filtered incidents into everything the intelligence screens show:

- `risk.ts` — splits the selected range into **recent vs previous 30-day windows**, clusters
  incidents per locality and scores each zone 0-100 from six weighted, explainable factors:
  frequency (0-30), trend (0-20), severity (0-15), repeat locations within 250 m (0-15),
  time-of-day concentration (0-10) and nearby activity within 3 km (0-10).
  Every factor is returned with its points, maximum and plain-language evidence, so a score
  is never shown without why it was produced.
- `changes.ts` — **"What changed?"**: rising (≥ 25%), emerging (no incidents previously) and
  declining (≥ 15%) signals between the two windows, with significance thresholds.
- `prediction.ts` — conservative, explainable forward view: a small, capped adjustment on top of
  each measured score from emerging status and trend direction, blended by confidence (declines
  are withheld below a confidence floor) and itemised as rationale. The measured score is retained
  as `baseScore`/`baseLevel`, and `riskScore`/`riskLevel` expose the predicted values so existing
  consumers transparently operate on the forward view.
- `recommend.ts` — patrol recommendation per zone: units, priority, focus window derived from
  the peak hours, patrol focus from the dominant crime, nearest station and rationale. Predicted
  variants keep high-confidence, high-risk zones from being demoted below their measured need.
- `patrol.ts` — deterministic dispatch plan and the position/status projection used by the
  simulation clock in `src/patrol/`. The priority-weighted plan fills the highest-priority
  (then highest predicted score) zones to their recommended strength first, concentrating units
  where future risk is elevated.
- `assistant.ts` — rule-based answers over the same outputs; it only ever quotes the current
  data and windows and never claims to predict exact crimes.

Scores are recomputed whenever filters or the date range change, so the map, KPIs, forecast,
recommendations and assistant always agree with each other.

## Architecture

```
src/
  analytics/         Deterministic engines: risk zones, changes, recommendations, patrol, assistant
  patrol/            Patrol simulation provider (patrolStore, PatrolContext, usePatrol)
  components/        Reusable UI (Sidebar, Header, FilterPanel, StatisticsPanel, RiskBreakdown,
                     RecommendationCard, WhatChangedPanel, charts, badges)
    map/             CrimeMap, CrimeMarker, PoliceStationMarker, RiskZoneLayer, ClusterLayer,
                     PatrolLayer, ZoneDetailPanel, MapLegend, PuducherryBoundaryMask, useCityBoundary
    ui/              Panel, StatTile/BarRow, Badge, PageHeader
  views/             One file per sidebar destination
  data/              Demo datasets (crimeIncidents, policeStations, areas) + cityBoundary loader
  services/          Data-access contracts (crimeApi, riskApi) — UI never imports data directly
  types/             Shared TypeScript interfaces
  utils/             Pure helpers: filters, stats, formatting, geo (incl. boundary/point-in-polygon), severity, CSV export, tokens
scripts/             Deterministic demo-data generator + OSM boundary fetcher
public/geojson/      Verified Puducherry city boundary (puducherry-city-boundary.geojson)
```

**Data is fully separated from the UI.** Components consume only the interfaces in
`src/types`, fetched through `src/services/*`.

**Demo data is land-guaranteed.** `scripts/generate-demo-data.mjs` places every
locality and station inside the Puducherry region (verified against the OSM
boundary) and the generator mirrors any jittered point that would fall outside
back inland — all 457 incidents and 11 stations render on land. On the map, points
that fall outside the (smaller) city boundary are additionally hidden by the
boundary clip; the datasets themselves are untouched.

### Connecting a real backend (PostgreSQL + PostGIS + FastAPI)

`src/services/crimeApi.ts` already ships an unused reference implementation:

```ts
const crimeDataSource: CrimeDataSource = httpCrimeDataSource('/api/v1')
// GET /api/v1/incidents, /api/v1/stations
```

Suggested server-side design: PostGIS `geography(Point)` for incidents/stations, GiST indexes
on geometry plus btree on `occurred_at`, materialised views for aggregate statistics, FastAPI
routers mirroring the two endpoints. Risk zones are currently computed client-side in
`src/analytics/risk.ts` and could move server-side later without any UI change.

### Connecting the future ML risk service

`src/services/riskApi.ts` defines the typed contract:

```ts
interface RiskPrediction {
  zoneId: string
  area: string
  risk_score: number      // 0-100
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
  confidence: number      // 0-1
  contributing_factors: string[]
  modelVersion: string
  isDemo: boolean
}
// GET /api/v1/risk/forecast -> RiskForecastResponse
```

Implement `httpRiskApi('/api/v1')` when the service exists. Until then the
Predictive Risk screen serves the deterministic `buildRiskForecast` output from
`src/analytics/risk.ts` and is labelled as engine output, not a model.

## Tech notes

- React 19, Vite 8, TypeScript strict (`tsc -b`), Tailwind CSS v4
- Leaflet markers use `divIcon` + `CircleMarker`, so no bundler image-path workarounds are needed
- Responsive: a persistent left navigation rail appears at `lg` and above, with a
  compact bottom navigation bar below `lg`; the selected risk-zone analysis moves into a
  right-hand rail at `xl` and is a bottom sheet below `xl`; the map stays the primary visual
  element and resizes automatically as the layout changes
