"""Forecast hook tests: heuristic path (forced) and trained-model path."""

from __future__ import annotations

from pathlib import Path

import pytest

from app import ml
from app.analytics import compute_risk_zones
from app.ml import HEURISTIC_VERSION, MODEL_PATH, forecast_from_zones

DATE_FROM, DATE_TO = "2026-04-01", "2026-10-08"


@pytest.fixture
def heuristic_only(monkeypatch):
    monkeypatch.setattr(ml, "MODEL_PATH", Path("does-not-exist.joblib"))
    return ml


def test_forecast_returns_one_prediction_per_zone(sample_incidents, heuristic_only):
    zones = compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)
    result = heuristic_only.forecast_from_zones(zones, horizon_days=30)
    predictions = result["predictions"]
    assert len(predictions) == len(zones)
    assert result["isDemo"] is True


def test_heuristic_scores_bounded_and_ranked(sample_incidents, heuristic_only):
    zones = compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)
    predictions = heuristic_only.forecast_from_zones(zones, horizon_days=30)["predictions"]
    scores = [p["riskScore"] for p in predictions]
    assert scores == sorted(scores, reverse=True)
    assert all(0 <= score <= 100 for score in scores)
    assert all(0.0 <= p["confidence"] <= 1.0 for p in predictions)
    assert all(p["modelVersion"] == HEURISTIC_VERSION for p in predictions)
    assert all(p["expectedIncidents"] >= 0 for p in predictions)


@pytest.mark.skipif(not MODEL_PATH.exists(), reason="trained artifact not present")
def test_trained_model_is_used_when_present(sample_incidents):
    zones = compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)
    predictions = forecast_from_zones(zones, horizon_days=30)["predictions"]
    assert predictions
    assert all(p["modelVersion"] != HEURISTIC_VERSION for p in predictions)
    assert all("expectedIncidents" in p for p in predictions)
    assert all(0 <= p["riskScore"] <= 100 for p in predictions)
