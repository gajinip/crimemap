# CRIMEMAP Implementation Log

Hackathon audit deliverable - chronological record of what was done, what was
deliberately not done, and the reproducible state of the repository.

Companion documents:
[Feature audit](CRIMEMAP_FEATURE_AUDIT.md) | [Architecture review](CRIMEMAP_ARCHITECTURE_REVIEW.md) | [Complexity analysis](CRIMEMAP_COMPLEXITY_ANALYSIS.md) | [Security review](CRIMEMAP_SECURITY_REVIEW.md) | [Test plan](CRIMEMAP_TEST_PLAN.md) | [Performance report](CRIMEMAP_PERFORMANCE_REPORT.md)

## Governing constraints (from the brief)

1. **Additive only** - do not change any existing logic, ideas, or the app.
   Every deliverable is a new file. Verified with `git status`: only untracked
   directories appear.
2. **Tests in a quarantine workspace** - `qa/` owns its own toolchain; the root
   `package.json` / `vite.config.ts` are untouched. Backend tests live in
   `backend/tests`.
3. **Security issues are reported, not fixed** - see the security review.
4. **Parallel backend is never imported by the app** - it is a standalone,
   auditable service.
5. **Phased execution with checkpoints** - each phase paused for sign-off.

## Repository anchor points

| Ref | Meaning |
| --- | --- |
| tag `rollback-baseline` -> `9b7a19d` | pristine last commit; rollback point requested before work began |
| `940fd04` (HEAD) | checkpoint commit of the pre-existing WIP (map-filter decoupling, related incidents, assistant, patrol icon, prediction wiring) |

Untracked (new) artefacts left in place: `backend/`, `docs/`, `qa/`.
Pre-existing stray file `-w` (a saved Vercel NOT_FOUND response) is unrelated
and left untouched.

## Phase log

### Phase 0 - Baseline and guardrails
- Captured environment (Node 24.18.1, npm 11.16.0, Python 3.13.7) and the clean
  `oxlint` + `npm run build` baseline (2007 modules, 1.38 s).
- Created rollback tag and committed the pre-existing WIP as a checkpoint.
- Confirmed no functional PostgreSQL (stale `PG17\data` only, port 5432 closed),
  no admin shell, no Docker.
- Installed Python test/geo packages (pytest, geoalchemy2, shapely).

### Phase 1 - Audit documents
- `docs/CRIMEMAP_FEATURE_AUDIT.md` - requirement -> status -> file:line evidence.
- `docs/CRIMEMAP_ARCHITECTURE_REVIEW.md` - recommended stack with a decision
  matrix and justified rejections (Redis, Kubernetes, broker, microservices,
  deck.gl, MapLibre, Next.js, Recharts).

### Phase 2 - Parallel backend
- Extracted the app's TS data literals to JSON via
  `backend/scripts/extract_demo_data.mjs` (457 incidents / 11 stations / 20 areas).
- Built FastAPI service: `schemas`, `analytics` (risk/changes/recommend/patrol),
  `ingest` (validate + dedupe + persist), `ml` (forecast hook), `repository`,
  `dto`, `bootstrap`, `main`, and 7 routers (incidents, stations, risk, ops,
  stats, assistant, admin).
- PostGIS `geography(Point,4326)` models with a composite area/time index.
- **Live DB verification deferred**: no PostgreSQL binary present and the
  install requires an elevated shell the agent does not have. Commands were
  provided to the user (`choco install postgresql17` / `postgis`).
- Two environment adaptations, both documented in code:
  - driver switched to `psycopg2-binary` (the installed `psycopg` 3 wheel has no
    `libpq` on this host);
  - the DB engine is created lazily so analytics/validation tests import without
    a driver or a running database.

### Phase 3 - Trainable forecasting model
- `backend/app/train.py`: sliding 30-day windows (15-day step), six-factor
  features from past data only, label = next-window incident count, **temporal**
  train/test split, three candidates, two baselines, PoD/PoFD, calibration bins.
- Persisted `backend/models/risk_model.joblib` and `metrics.json`.
- `/risk/forecast` now serves the trained estimator (count -> score mapping,
  `expectedIncidents`); the deterministic heuristic remains the fallback.
- **Honest outcome recorded**: the model ties but does not beat the per-area
  historical-mean baseline. Reported rather than disguised.

### Phase 4 - Quarantine QA workspace
- `qa/` with its own `package.json`, `vitest.config.ts`, `playwright.config.ts`,
  `tsconfig.json`.
- 31 Vitest unit tests over `src/utils/{geo,severity,filters,stats}`.
- 3 Playwright E2E tests (boot + banner + rendered map, view switching, area
  filter); Chromium installed; Vite 8 IPv6 bind handled with `--host 127.0.0.1`.
- `qa/load/locustfile.py` for frontend and backend load scenarios.
- Two genuine app quirks surfaced and pinned by tests (not fixed):
  `buildMonthlySeries` leading zero month, and the reversed `ringSignedArea`
  sign convention.

### Phases 5-7 - Remaining documents
- `docs/CRIMEMAP_COMPLEXITY_ANALYSIS.md` (also holds the benchmark targets).
- `docs/CRIMEMAP_SECURITY_REVIEW.md` (findings only).
- `docs/CRIMEMAP_TEST_PLAN.md`.
- `docs/CRIMEMAP_PERFORMANCE_REPORT.md`.
- this `docs/CRIMEMAP_IMPLEMENTATION_LOG.md`.

## Verification summary

| Check | Command | Result |
| --- | --- | --- |
| App lint + build | `npm run lint; npm run build` | clean; 1.38 s; gzip 179.5 kB JS |
| Backend tests | `python -m pytest -q` (in `backend/`) | 20 passed, 2 skipped (DB-gated) |
| Unit tests | `npm --prefix qa run test:unit` | 31 passed |
| E2E tests | `npx playwright test` (in `qa/`) | 3 passed |
| App untouched | `git status --short` | only untracked `backend/`, `docs/`, `qa/` |

## Open items

1. **Live database verification** - run the elevated PostgreSQL + PostGIS
   install, then `python -m app.bootstrap`, `python -m app.ingest`, and the
   DB-gated pytest tests. This is the only unfinished phase (2b).
2. Deeper view-level tests are intentionally out of scope under the quarantine
   constraint.
3. The model must be re-baselined on real data before any operational use.