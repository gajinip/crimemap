"""Analytics engine tests (pure, no database required)."""

from __future__ import annotations

from app.analytics import (
    build_analysis_window,
    build_patrol_plan,
    build_recommendations,
    compute_risk_zones,
    detect_changes,
    haversine_m,
    peak_window,
)

DATE_FROM, DATE_TO = "2026-04-01", "2026-10-08"

STATIONS = [
    {"id": "PS-01", "name": "Central", "lat": 26.85, "lng": 80.95},
    {"id": "PS-02", "name": "North", "lat": 26.90, "lng": 81.00},
]


def test_haversine_zero_and_known_distance():
    assert haversine_m((26.85, 80.94), (26.85, 80.94)) == 0.0
    one_km_east = haversine_m((26.85, 80.94), (26.85, 80.950069))
    assert 900 < one_km_east < 1100


def test_window_is_clamped_to_valid_bounds():
    window = build_analysis_window("2026-01-01", "2026-01-02")
    assert window["days"] == 7
    long_window = build_analysis_window("2025-01-01", "2026-01-01")
    assert long_window["days"] == 30
    assert window["previousTo"] <= window["recentFrom"] <= window["recentTo"]


def test_peak_window_buckets():
    incidents = [
        {"occurredAt": "2026-10-05T21:30:00+05:30"},
        {"occurredAt": "2026-10-05T22:10:00+05:30"},
        {"occurredAt": "2026-10-05T08:00:00+05:30"},
    ]
    label, share, count = peak_window(incidents)
    assert label == "21:00-00:00"
    assert count == 2
    assert round(share, 2) == 0.67


def test_risk_zones_are_bounded_and_ranked(sample_incidents):
    zones = compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)
    assert zones, "expected at least one risk zone"
    scores = [z.riskScore for z in zones]
    assert scores == sorted(scores, reverse=True)
    assert all(0 <= score <= 100 for score in scores)
    assert [z.id for z in zones] == [f"RZ-{i:02d}" for i in range(1, len(zones) + 1)]
    for zone in zones:
        assert len(zone.components) == 6
        assert zone.area
        assert zone.riskLevel in {"Low", "Medium", "High", "Critical"}


def test_emerging_area_flagged(sample_incidents):
    zones = {z.area: z for z in compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)}
    assert zones["Area C"].isEmerging is True
    assert zones["Area A"].isEmerging is False


def test_changes_surface_rising_and_declining(sample_incidents):
    report = detect_changes(sample_incidents, DATE_FROM, DATE_TO)
    kinds = {signal.kind for signal in report.signals}
    assert "emerging" in kinds  # Area C had zero incidents before
    assert report.recentTotal > 0
    assert isinstance(report.overallDeltaPercent, int)


def test_recommendations_ranked_and_bounded(sample_incidents):
    zones = compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)
    recs = build_recommendations(zones, STATIONS)
    assert recs
    assert len(recs) <= 6
    assert all(r.priority in {"P1", "P2", "P3"} for r in recs)
    assert all(r.units >= 0 for r in recs)
    assert all(r.nearestStation.distanceMeters >= 0 for r in recs)


def test_patrol_plan_assigns_at_most_six_units(sample_incidents):
    zones = compute_risk_zones(sample_incidents, DATE_FROM, DATE_TO)
    recs = build_recommendations(zones, STATIONS)
    plan = build_patrol_plan(zones, STATIONS, recs, "2026-10-08T00:00:00+00:00")
    assert len(plan.units) <= 6
    assert plan.coveredZones == len({u.zoneId for u in plan.units if u.zoneId})
