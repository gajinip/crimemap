# CRIMEMAP Performance Report

Hackathon audit deliverable - measured results for the existing app build, the
isolated QA suite, the parallel backend, and the forecasting model, judged
against the target table in
[CRIMEMAP_COMPLEXITY_ANALYSIS.md](CRIMEMAP_COMPLEXITY_ANALYSIS.md).

Companion documents:
[Feature audit](CRIMEMAP_FEATURE_AUDIT.md) | [Architecture review](CRIMEMAP_ARCHITECTURE_REVIEW.md) | [Test plan](CRIMEMAP_TEST_PLAN.md) | [Implementation log](CRIMEMAP_IMPLEMENTATION_LOG.md)

**Environment**: Windows 11, Node 24.18.1, npm 11.16.0, Python 3.13.7,
Vite 8.3.3, Ryzen-class laptop, no dedicated GPU. All timings are single-run
observations on this machine; they are indicative, not statistically rigorous.

## 1. Frontend build

| Metric | Value | Target | Verdict |
| --- | --- | --- | --- |
| Modules transformed | 2,007 | - | - |
| Build wall time | 1.38 s | <= 5 s | PASS |
| JS bundle | 672.78 kB | - | - |
| JS bundle (gzip) | 179.54 kB | <= 250 kB | PASS |
| CSS bundle | 66.28 kB | - | - |
| CSS bundle (gzip) | 16.15 kB | - | PASS |

Notes:
- The Vite "chunk larger than 500 kB" warning is a **notice**, not a failure;
  gzip size remains within the demo target.
- The main weight is Leaflet + React + the 457-record dataset compiled into the
  bundle. Moving the dataset behind the new API (future work) would trim the
  initial payload meaningfully.

## 2. QA suite

| Layer | Result | Duration |
| --- | --- | --- |
| Vitest unit (`qa/unit`) | 31 passed / 31 | ~1.2 s test time |
| Playwright E2E (`qa/e2e`) | 3 passed / 3 | 14.5 s (includes dev-server start) |
| pytest backend | 20 passed, 2 skipped | ~10-12 s |

The 2 skipped backend tests are the PostgreSQL/PostGIS-gated API round-trips;
they ran here with the database unavailable and will activate once PostgreSQL is
installed. E2E run time is dominated by the Vite dev-server boot, not the tests.

## 3. Backend analytics

| Test | Input | Result | Target | Verdict |
| --- | --- | --- | --- | --- |
| `compute_risk_zones` | 457 incidents, 20 areas | 20 zones in **1.9 ms** | <= 500 ms @10k | PASS (demo scale) |

The engine is a port of the client scoring, so the two implementations can be
cross-checked value-for-value.

## 4. Forecasting model

| Metric | Value |
| --- | --- |
| Samples (sliding 30-day windows, 15-day step) | 177 |
| Train / held-out (temporal split) | 118 / 59 |
| Training wall time | **0.31 s** |
| Ridge (selected) | MAE **1.704**, RMSE **2.292** |
| Gradient boosting | MAE 1.826, RMSE 2.460 |
| Random forest | MAE 1.826, RMSE 2.416 |
| Baseline: seasonal-naive | MAE 1.780, RMSE 2.439 |
| Baseline: historical-mean | MAE **1.636**, RMSE 2.121 |
| Detection (threshold 5) | PoD 0.357, PoFD 0.000 |
| Inference (`/risk/forecast`) | milliseconds for 20 zones |

**Honest reading**: the trained model beats the seasonal-naive baseline on MAE
(1.704 vs 1.780) but does **not** beat the per-area historical mean (1.636).
The calibration table (`backend/models/metrics.json`) shows the model
under-predicts the highest-risk bin (mean predicted 5.19 vs actual 7.67), which
is why probability-of-detection is low. This is exactly what one should expect
from a few hundred synthetic records: the learnable signal is weak and a
per-area mean is a strong prior. The exercise demonstrates the **methodology**
(temporal split, multiple candidates, calibrated baselines) truthfully; it does
not claim operational accuracy.

## 5. Bundle/host comparison summary

| Dimension | Existing app | Parallel backend |
| --- | --- | --- |
| Data location | compiled into JS | PostgreSQL/PostGIS |
| Risk scoring | in-browser | server-side (same algorithm) |
| Forecast | deterministic rules | trained estimator + heuristic fallback |
| Tests | none (before) | 20 pytest + 31 Vitest + 3 E2E in quarantine |

## 6. Recommendations

1. Move the 457-record dataset behind the API to shrink the initial bundle.
2. Replace the O(N^2) repeat test with a grid before any live feed.
3. Re-baseline the model on real data; keep the historical-mean baseline as the
   gate any model must beat before it is wired into decisions.
4. Add a lightweight bundle-size budget check to CI (see the test plan).