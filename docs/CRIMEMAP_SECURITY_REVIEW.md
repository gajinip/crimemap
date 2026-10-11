# CRIMEMAP Security Review

Hackathon audit deliverable - **findings only; fixes were intentionally scoped
out** (the program must not modify the existing app). Severity uses CVSS-like
labels (Critical / High / Medium / Low) plus a pragmatic "demo risk" note,
because this application is an interface-demonstration product.

Companion documents:
[Feature audit](CRIMEMAP_FEATURE_AUDIT.md) | [Architecture review](CRIMEMAP_ARCHITECTURE_REVIEW.md) | [Complexity analysis](CRIMEMAP_COMPLEXITY_ANALYSIS.md) | [Implementation log](CRIMEMAP_IMPLEMENTATION_LOG.md)

## Scope and constraints

- Reviewed: the React SPA (`src/**`), the parallel FastAPI backend (`backend/**`),
  and the isolated QA workspace (`qa/**`).
- Deliberately **not** reviewed: OS/host hygiene, the bundler supply chain, and
  third-party CDN tile providers used by Leaflet.
- The parallel backend is **not wired to the app**; its findings are about the
  service itself.
- Status column reflects the additive constraint: `REPORTED` = noted but not
  changed, `PARALLEL` = a mitigated replacement exists in the new backend.

## Findings

### F-1 Critical - OpenAI API key shipped to the browser

- **Location**: `src/services/assistantApi.ts:6` and its use at line 142.
  - `VITE_OPENAI_API_KEY` is read with `import.meta.env`; every `VITE_` prefixed
    variable is inlined into the production bundle. The key is exfiltratable from
    the bundle, the browser devtools, and any network capture of the calls made
    from the page.
- **Impact**: total loss of the key; attacker can run the account to cost limits,
    read billing, and (worst case) trigger any billing-linked actions on the
    OpenAI account. There is no per-request authentication to the chat endpoint.
- **Demo risk**: real only if a live key is actually present in a build. The
  bundled demo ships with a placeholder, but the code path is the risk.
- **Status**: `REPORTED`. Remediation is to call the model from a server and
  keep the key server-side.

### F-2 High - No authentication or authorization

- **Location**: the SPA (no login or session concept anywhere) and every
  `/admin/*` route of the parallel backend (`backend/app/routers/admin.py`).
- **Impact**: anyone who can reach the service can load the full incident set
  (and, on the backend, overwrite the dataset via `POST /admin/ingest`).
- **Demo risk**: contained while the app is a static interface demo, but the
  backend is a real API and must not be deployed without auth.
- **Status**: `PARALLEL` flagged in the backend README; no change to the app.

### F-3 Medium - CSV export allows formula injection

- **Location**: `src/utils/export.ts:3-9` - the export writes only the raw
  description text, with no leading-character sanitisation.
- **Impact**: when a user opens the exported CSV in a spreadsheet, a value
  starting with `=`, `+`, `-`, or `@` may be evaluated as a formula (a classic
  CWE-1236 vector). The demo dataset is trusted, but the column accepts
  free-text `description`, and a future live feed would inherit the flaw.
- **Status**: `REPORTED`.

### F-4 Medium - Backend CORS is wide open (parallel service only)

- **Location**: `backend/app/main.py` - `allow_origins=["*"]`.
- **Impact**: any origin can read API responses in a browser context. Not part
  of the SPA, but it is the service you would actually deploy.
- **Status**: `PARALLEL` - documented in `backend/README.md`; not changed, out
  of the additive scope.

### F-5 Medium - No secrets management, no rate limiting (backend)

- **Location**: `backend/app/config.py` (env-driven, plain `.env`), the
  `/assistant/ask` proxy (`backend/app/routers/assistant.py`) with a 30 s
  client timeout and **no rate limit on token spend**, and `/admin/ingest`
  with no audit trail.
- **Impact**: cost abuse on the assistant proxy; no traceability on dataset
  replacement.
- **Demo risk**: low.
- **Status**: `PARALLEL` flagged; mitigated only by the "call is guarded to
  fall back when unconfigured" behaviour.

## Positive findings

- The persistent, unambiguous data disclaimer (`DemoBanner`) is good practice
  and required context for any demo of this kind.
- The app never talks to the backend, so the SPA has no arbitrary API surface
  beyond the OpenAI call in F-1.
- The new backend keeps coordinates and geometry typed (PostGIS), and the
  assistant proxy keeps the key server-side (`assistant.py` reads
  `os.environ`, never `VITE_`).

## Recommended remediation order (out of scope, documented anyway)

1. Move the OpenAI call server-side (the `POST /assistant/ask` proxy in
   `backend/app/routers/assistant.py` is the drop-in), delete
   `VITE_OPENAI_API_KEY` from any real build config.
2. Restrict backend CORS to the app origin; add a minimal token to `/admin/*`.
3. Sanitise the leading CSV character in the export module.
4. Add rate limiting + request auth on `/assistant/ask`.

Nothing in this document has been fixed in the tracked app or the parallel
backend; changes are limited to documentation (see the implementation log).