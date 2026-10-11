"""Train a genuine supervised model for next-window incident count per area.

Method
------
Sliding 30-day windows (15-day step) are generated across the dataset span. For
each area and window the six-factor analytics features are computed from *past*
data only; the label is the incident count observed in the immediately following
30 days. Windows are split **temporally** (earlier windows train, later windows
test) so evaluation reflects forward prediction, not interpolation.

Baselines (`seasonal-naive` = previous window, `historical-mean` = per-area mean)
are reported alongside the learned model. Only the best model by test MAE is
persisted; the training data is synthetic, so this demonstrates methodology.

Run:  python -m app.train
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .analytics import DAY, IST, compute_risk_zones, parse_dt
from .ingest import load_json

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODEL_DIR / "risk_model.joblib"
METRICS_PATH = MODEL_DIR / "metrics.json"

VERSION_PREFIX = "incident-count"
FEATURES = [
    "crimeCount",
    "previousCount",
    "trendPercent",
    "repeatShare",
    "nearbyCount",
    "dominantShare",
    "peakShare",
    "riskScore",
]
WINDOW_DAYS = 30
STEP_DAYS = 15
TRAIN_FRACTION = 0.7
ALARM_QUANTILE = 0.75


def _end_of_day(iso_date: str) -> datetime:
    return datetime.fromisoformat(f"{iso_date}T23:59:59").replace(tzinfo=IST)


def build_samples(incidents: list[dict]) -> pd.DataFrame:
    times = [parse_dt(i["occurredAt"]) for i in incidents]
    times = [t for t in times if t is not None]
    start = min(times).date()
    end = max(times).date()

    by_area: dict[str, list[datetime]] = {}
    for incident, when in zip(incidents, times):
        by_area.setdefault(incident["area"], []).append(when)

    rows: list[dict] = []
    cursor = start + timedelta(days=WINDOW_DAYS)
    last_window_end = end - timedelta(days=WINDOW_DAYS)
    while cursor <= last_window_end:
        date_to = cursor.isoformat()
        date_from = (cursor - timedelta(days=WINDOW_DAYS - 1)).isoformat()
        zones = compute_risk_zones(incidents, date_from, date_to)

        label_start = _end_of_day(date_to)
        label_end = label_start + timedelta(days=WINDOW_DAYS)
        for zone in zones:
            label = sum(
                1
                for when in by_area.get(zone.area, [])
                if label_start < when <= label_end
            )
            rows.append(
                {
                    "window_end": date_to,
                    "area": zone.area,
                    **{name: getattr(zone, name) for name in FEATURES},
                    "label": label,
                }
            )
        cursor += timedelta(days=STEP_DAYS)
    return pd.DataFrame(rows)


def _rmse(y_true, y_pred) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def _pod_pofd(y_true, y_pred, threshold: float) -> tuple[float, float]:
    actual = y_true >= threshold
    alarm = y_pred >= threshold
    tp = int(np.sum(actual & alarm))
    fn = int(np.sum(actual & ~alarm))
    fp = int(np.sum(~actual & alarm))
    tn = int(np.sum(~actual & ~alarm))
    pod = tp / (tp + fn) if (tp + fn) else 0.0
    pofd = fp / (fp + tn) if (fp + tn) else 0.0
    return round(pod, 3), round(pofd, 3)


def _calibration(y_true, y_pred, bins: int = 5) -> list[dict]:
    frame = pd.DataFrame({"y": np.asarray(y_true), "p": np.asarray(y_pred)})
    if frame["p"].nunique() < bins:
        edges = np.linspace(frame["p"].min(), frame["p"].max() + 1e-9, bins + 1)
        frame["bin"] = pd.cut(frame["p"], edges, include_lowest=True)
    else:
        frame["bin"] = pd.qcut(frame["p"], bins, duplicates="drop")
    grouped = frame.groupby("bin", observed=True).agg(
        meanPredicted=("p", "mean"), meanActual=("y", "mean"), n=("y", "size")
    )
    return [
        {
            "range": str(index),
            "meanPredicted": round(float(values["meanPredicted"]), 2),
            "meanActual": round(float(values["meanActual"]), 2),
            "count": int(values["n"]),
        }
        for index, values in grouped.iterrows()
    ]


def _candidates() -> dict[str, object]:
    return {
        "ridge": Pipeline([("scale", StandardScaler()), ("model", Ridge(alpha=1.0))]),
        "gradient_boosting": GradientBoostingRegressor(
            n_estimators=200, max_depth=2, learning_rate=0.05, random_state=0
        ),
        "random_forest": RandomForestRegressor(
            n_estimators=300, max_depth=4, random_state=0
        ),
    }


def train() -> dict:
    incidents = load_json("incidents")
    frame = build_samples(incidents)
    if frame.empty:
        raise RuntimeError("no training samples were generated")

    window_ends = sorted(frame["window_end"].unique())
    cutoff_index = max(1, int(len(window_ends) * TRAIN_FRACTION))
    train_ends = set(window_ends[:cutoff_index])
    train = frame[frame["window_end"].isin(train_ends)]
    test = frame[~frame["window_end"].isin(train_ends)]
    if test.empty:
        test = train  # tiny datasets: fall back to resubstitution, flagged below

    x_train, y_train = train[FEATURES].to_numpy(float), train["label"].to_numpy(float)
    x_test, y_test = test[FEATURES].to_numpy(float), test["label"].to_numpy(float)

    results: dict[str, dict] = {}
    for name, estimator in _candidates().items():
        estimator.fit(x_train, y_train)
        predicted = estimator.predict(x_test)
        results[name] = {
            "mae": round(float(mean_absolute_error(y_test, predicted)), 3),
            "rmse": round(_rmse(y_test, predicted), 3),
        }

    threshold = float(np.quantile(y_train, ALARM_QUANTILE))
    area_mean = train.groupby("area")["label"].mean().to_dict()
    global_mean = float(y_train.mean())
    baselines = {
        "seasonal_naive": {
            "mae": round(float(mean_absolute_error(y_test, test["previousCount"])), 3),
            "rmse": round(_rmse(y_test, test["previousCount"].to_numpy(float)), 3),
        },
        "historical_mean": {
            "mae": round(
                float(
                    mean_absolute_error(
                        y_test,
                        test["area"].map(area_mean).fillna(global_mean),
                    )
                ),
                3,
            ),
            "rmse": round(
                _rmse(
                    y_test,
                    test["area"].map(area_mean).fillna(global_mean).to_numpy(float),
                ),
                3,
            ),
        },
    }

    best_name = min(results, key=lambda key: results[key]["mae"])
    version = f"{VERSION_PREFIX}-{best_name}-v1"
    best = _candidates()[best_name]
    best.fit(x_train, y_train)
    test_pred = best.predict(x_test)
    pod, pofd = _pod_pofd(y_test, test_pred, threshold)

    final = _candidates()[best_name]
    final.fit(frame[FEATURES].to_numpy(float), frame["label"].to_numpy(float))
    count_scale = float(max(np.quantile(frame["label"], 0.95), 1.0))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": final,
            "features": FEATURES,
            "version": version,
            "output": "incident_count",
            "count_scale": count_scale,
        },
        MODEL_PATH,
    )

    metrics = {
        "version": version,
        "target": "next_window_incident_count",
        "windowDays": WINDOW_DAYS,
        "stepDays": STEP_DAYS,
        "samples": int(len(frame)),
        "trainSamples": int(len(train)),
        "testSamples": int(len(test)),
        "testIsHeldOut": not test.empty and len(test) != len(train),
        "features": FEATURES,
        "models": results,
        "baselines": baselines,
        "bestModel": best_name,
        "detection": {
            "alarmThreshold": round(threshold, 3),
            "probabilityOfDetection": pod,
            "probabilityOfFalseDetection": pofd,
        },
        "calibration": _calibration(y_test, test_pred),
        "countScaleP95": round(count_scale, 2),
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


if __name__ == "__main__":  # pragma: no cover - CLI convenience
    summary = train()
    print(json.dumps(summary, indent=2))
