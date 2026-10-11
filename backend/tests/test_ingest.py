"""Validation, dedupe and dataset integrity tests."""

from __future__ import annotations

from app.ingest import dedupe, load_json, validate_incident
from tests.conftest import make_incident


def test_valid_record_passes():
    assert validate_incident(make_incident("OK-1")) is None


def test_invalid_category_rejected():
    assert "invalid category" in (validate_incident(make_incident("BAD-1", category="Arson")) or "")


def test_invalid_status_rejected():
    assert "invalid status" in (validate_incident(make_incident("BAD-2", status="Pending")) or "")


def test_out_of_range_coordinates_rejected():
    record = make_incident("BAD-3")
    record["lat"] = 123.0
    assert "out of range" in (validate_incident(record) or "")


def test_bad_timestamp_rejected():
    record = make_incident("BAD-4")
    record["occurredAt"] = "not-a-date"
    assert "invalid timestamp" in (validate_incident(record) or "")


def test_dedupe_keeps_first():
    rows = [make_incident("DUP-1"), make_incident("DUP-1"), make_incident("DUP-2")]
    unique, duplicates = dedupe(rows)
    assert duplicates == 1
    assert [r["id"] for r in unique] == ["DUP-1", "DUP-2"]


def test_bundled_dataset_is_unique_and_valid():
    incidents = load_json("incidents")
    assert len(incidents) > 0
    unique, duplicates = dedupe(incidents)
    assert duplicates == 0
    assert len(unique) == len(incidents)
    assert all(validate_incident(record) is None for record in incidents)
