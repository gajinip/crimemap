"""Risk forecasting.

Phase 2 ships a transparent heuristic that mirrors the client's deterministic
"predictive" score, wrapped behind a model-swap hook. Phase 3 attaches a real
trained estimator (`models/risk_model.joblib`); when that artifact is present it
is used, otherwise the heuristic keeps the endpoint available.
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from .analytics import risk_level_for
from .schemas import RiskZoneOut

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "risk_model.joblib"
HEURISTIC_VERSION = "heuristic-v1"


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _heuristic_prediction(zone: RiskZoneOut, horizon_days: int) -> dict:
    baseline = zone.riskScore
    projected = clamp(round(baseline + clamp(zone.trendPercent, -50, 50) * 0.15))
    expected = round(
        max(0.0, zone.crimeCount * (1 + clamp(zone.trendPercent, -50, 50) / 100)), 1
    )
    confidence = round(min(0.9, 0.5 + zone.crimeCount * 0.03), 2)
    factors = [
        f"{c.label}: {c.detail}"
        for c in sorted(zone.components, key=lambda c: -c.points)[:3]
        if c.points > 0
    ]
    if not factors:
        factors = ["No recent contributing incidents"]
    return {
        "zoneId": zone.id,
        "area": zone.area,
        "riskScore": int(projected),
        "riskLevel": risk_level_for(projected),
        "expectedIncidents": expected,
        "confidence": confidence,
        "contributingFactors": factors + [f"Horizon: next {horizon_days} days"],
        "modelVersion": HEURISTIC_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "isDemo": True,
    }


def _model_prediction(zones: list[RiskZoneOut], horizon_days: int) -> list[dict] | None:
    """Use the trained artifact when available; return None otherwise."""
    try:
        import joblib  # noqa: PLC0415
    except ImportError:
        return None
    if not MODEL_PATH.exists():
        return None

    bundle = joblib.load(MODEL_PATH)
    estimator = bundle["model"]
    version = bundle.get("version", "risk-model-v1")
    feature_names = bundle.get("features", [])
    output = bundle.get("output", "risk_score")
    count_scale = float(bundle.get("count_scale", 1.0)) or 1.0

    predictions: list[dict] = []
    for zone in zones:
        row = {
            "crimeCount": zone.crimeCount,
            "previousCount": zone.previousCount,
            "trendPercent": zone.trendPercent,
            "repeatShare": zone.repeatShare,
            "nearbyCount": zone.nearbyCount,
            "dominantShare": zone.dominantShare,
            "peakShare": zone.peakShare,
            "riskScore": zone.riskScore,
        }
        vector = [[row.get(name, 0.0) for name in feature_names]]
        raw = float(estimator.predict(vector)[0])
        if output == "incident_count":
            expected: float | None = round(max(0.0, raw), 1)
            score = clamp(round(max(0.0, raw) / count_scale * 100))
        else:
            expected = None
            score = clamp(round(raw))
        confidence = round(min(0.95, 0.55 + zone.crimeCount * 0.02), 2)
        predictions.append(
            {
                "zoneId": zone.id,
                "area": zone.area,
                "riskScore": int(score),
                "riskLevel": risk_level_for(score),
                "expectedIncidents": expected,
                "confidence": confidence,
                "contributingFactors": [
                    f"{c.label}: {c.detail}"
                    for c in sorted(zone.components, key=lambda c: -c.points)[:3]
                    if c.points > 0
                ],
                "modelVersion": version,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "isDemo": True,
            }
        )
    return predictions


def forecast_from_zones(zones: list[RiskZoneOut], horizon_days: int = 30) -> dict:
    predictions = _model_prediction(zones, horizon_days)
    if predictions is None:
        predictions = [_heuristic_prediction(zone, horizon_days) for zone in zones]
    predictions.sort(key=lambda p: -p["riskScore"])
    return {"predictions": predictions, "isDemo": True}
