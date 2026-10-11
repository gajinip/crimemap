"""Deterministic analytics engines (server-side port of `src/analytics/*`).

The scoring is intentionally identical in spirit to the React engines so the
two implementations can be cross-checked: an explainable weighted sum of six
factors (frequency 30, trend 20, severity 15, repeat 15, timeOfDay 10,
proximity 10). Values are never randomised.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

from .schemas import (
    ChangeReportOut,
    ChangeSignalOut,
    NearestStationOut,
    PatrolPlanOut,
    PatrolUnitOut,
    RecommendationOut,
    RiskComponentOut,
    RiskZoneOut,
)

IST = timezone(timedelta(hours=5, minutes=30))
DAY = timedelta(days=1)

WEIGHTS = {
    "frequency": 30,
    "trend": 20,
    "severity": 15,
    "repeat": 15,
    "timeOfDay": 10,
    "proximity": 10,
}
REPEAT_RADIUS_M = 250
NEARBY_RADIUS_M = 3000
PEAK_BUCKETS = 8
MAX_WINDOW_DAYS = 30
MIN_WINDOW_DAYS = 7

SEVERITY_BY_CATEGORY = {
    "Theft": "Medium",
    "Robbery": "Critical",
    "Assault": "High",
    "Burglary": "High",
    "Vehicle Theft": "Medium",
    "Fraud": "Low",
    "Other": "Low",
}
SEVERITY_WEIGHT = {"Low": 0.25, "Medium": 0.5, "High": 0.75, "Critical": 1.0}

FOCUS_BY_CRIME = {
    "Theft": "plain-clothes coverage of the retail stretch plus CCTV checks",
    "Robbery": "high-visibility two-wheeler patrol near transit stops",
    "Assault": "beat patrol around junctions and late-night gathering spots",
    "Burglary": "night beat across residential lanes and closed shutters",
    "Vehicle Theft": "marshals on parking clusters and no-parking stretches",
    "Fraud": "verification desk at market beats plus a cyber-cell review",
    "Other": "general preventive patrol and beat coverage",
}

CALLSIGNS = ["Echo", "Falcon", "Guardian", "Hunter", "Jaguar", "Kestrel"]
UNIT_COUNT = 6


def parse_dt(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance in metres between (lat, lng) pairs."""
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371000.0 * math.asin(min(1.0, math.sqrt(h)))


def _day_start(iso_date: str) -> datetime:
    return datetime.fromisoformat(f"{iso_date}T00:00:00").replace(tzinfo=IST)


def _day_end(iso_date: str) -> datetime:
    return datetime.fromisoformat(f"{iso_date}T23:59:59").replace(tzinfo=IST)


def build_analysis_window(date_from: str, date_to: str) -> dict[str, Any]:
    to = _day_end(date_to)
    frm = _day_start(date_from)
    span = max(MIN_WINDOW_DAYS, round((to - frm).total_seconds() / 86400))
    days = min(MAX_WINDOW_DAYS, max(MIN_WINDOW_DAYS, span))
    recent_to = to
    recent_from = recent_to - days * DAY
    previous_to = recent_from
    previous_from = previous_to - days * DAY

    def label(dt: datetime) -> str:
        return dt.astimezone(IST).strftime("%d %b")

    return {
        "days": days,
        "recentFrom": recent_from.timestamp() * 1000,
        "recentTo": recent_to.timestamp() * 1000,
        "previousFrom": previous_from.timestamp() * 1000,
        "previousTo": previous_to.timestamp() * 1000,
        "recentLabel": f"{label(recent_from)} - {label(recent_to)}",
        "previousLabel": f"{label(previous_from)} - {label(previous_to)}",
    }


def _hour_of(incident: dict) -> int:
    dt = parse_dt(incident["occurredAt"])
    return dt.astimezone(IST).hour if dt else 12


def peak_window(incidents: list[dict]) -> tuple[str, float, int]:
    if not incidents:
        return "—", 0.0, 0
    buckets = [0] * PEAK_BUCKETS
    for incident in incidents:
        buckets[_hour_of(incident) // 3] += 1
    best = max(range(PEAK_BUCKETS), key=lambda i: buckets[i])
    start = best * 3
    end = (start + 3) % 24
    return f"{start:02d}:00-{end:02d}:00", buckets[best] / len(incidents), buckets[best]


def dominant_category(incidents: list[dict]) -> tuple[str, float]:
    if not incidents:
        return "Other", 0.0
    counts: dict[str, int] = {}
    for incident in incidents:
        counts[incident["category"]] = counts.get(incident["category"], 0) + 1
    category = max(counts, key=lambda k: counts[k])
    return category, counts[category] / len(incidents)


def risk_level_for(score: float) -> str:
    if score >= 75:
        return "Critical"
    if score >= 55:
        return "High"
    if score >= 35:
        return "Medium"
    return "Low"


def status_for(level: str) -> str:
    if level in ("Critical", "High"):
        return "Active"
    if level == "Medium":
        return "Monitoring"
    return "Contained"


def trend_for(percent: float) -> str:
    if percent > 5:
        return "Rising"
    if percent < -5:
        return "Declining"
    return "Stable"


def _centroid(incidents: Iterable[dict]) -> tuple[float, float] | None:
    rows = list(incidents)
    if not rows:
        return None
    return (
        sum(r["lat"] for r in rows) / len(rows),
        sum(r["lng"] for r in rows) / len(rows),
    )


def _radius_for(incidents: list[dict], center: tuple[float, float]) -> int:
    if not incidents:
        return 450
    spread = max(haversine_m(center, (r["lat"], r["lng"])) for r in incidents)
    radius = round((max(spread, 80) * 1.5) / 50) * 50
    return int(min(800, max(350, radius)))


def compute_risk_zones(
    incidents: list[dict], date_from: str, date_to: str
) -> list[RiskZoneOut]:
    window = build_analysis_window(date_from, date_to)
    by_area: dict[str, dict[str, list[dict]]] = {}
    for incident in incidents:
        dt = parse_dt(incident["occurredAt"])
        if dt is None:
            continue
        ms = dt.timestamp() * 1000
        if ms < window["previousFrom"] or ms > window["recentTo"]:
            continue
        bucket = by_area.setdefault(incident["area"], {"recent": [], "previous": []})
        key = "recent" if ms >= window["recentFrom"] else "previous"
        bucket[key].append(incident)

    areas: list[dict] = []
    for area, entry in by_area.items():
        windowed = entry["previous"] + entry["recent"]
        center = _centroid(windowed)
        if center is None:
            continue
        areas.append({"area": area, "recent": entry["recent"], "previous": entry["previous"], "center": center})

    if not areas:
        return []

    def nearby_of(target: dict) -> int:
        total = 0
        for other in areas:
            if other["area"] == target["area"]:
                continue
            if haversine_m(target["center"], other["center"]) <= NEARBY_RADIUS_M:
                total += len(other["recent"])
        return total

    max_recent = max(8, max(len(a["recent"]) for a in areas))
    max_nearby = max(1, max(nearby_of(a) for a in areas))

    zones: list[RiskZoneOut] = []
    for area in areas:
        zones.append(
            _score_area(area, areas, nearby_of, window, max_recent, max_nearby)
        )

    zones.sort(key=lambda z: (-z.riskScore, z.area))
    for index, zone in enumerate(zones, start=1):
        zone.id = f"RZ-{index:02d}"
    return zones


def _score_area(
    area: dict,
    areas: list[dict],
    nearby_of,
    window: dict,
    max_recent: int,
    max_nearby: int,
) -> RiskZoneOut:
    recent: list[dict] = area["recent"]
    previous: list[dict] = area["previous"]
    center: tuple[float, float] = area["center"]
    basis = recent if recent else previous
    dominant, dominant_share = dominant_category(basis)
    peak_label, peak_share, _ = peak_window(basis)
    components: list[RiskComponentOut] = []

    # frequency
    freq_ratio = len(recent) / max_recent if max_recent else 0.0
    components.append(
        RiskComponentOut(
            key="frequency",
            label="Recent incidents",
            points=round(min(max(freq_ratio, 0.0), 1.0) * WEIGHTS["frequency"], 1),
            max=float(WEIGHTS["frequency"]),
            detail=(
                f"No incidents in the last {window['days']} days"
                if not recent
                else f"{len(recent)} incidents in {window['days']} days"
            ),
        )
    )

    # trend
    if not previous:
        trend_percent = 100.0 if recent else 0.0
    else:
        trend_percent = (len(recent) - len(previous)) / len(previous) * 100.0
    growth = 1.0 if (not previous and recent) else max(0.0, min(trend_percent / 100.0, 1.0))
    components.append(
        RiskComponentOut(
            key="trend",
            label="Trend vs previous period",
            points=round(growth * WEIGHTS["trend"], 1),
            max=float(WEIGHTS["trend"]),
            detail=f"{trend_percent:+.0f}% vs previous {window['days']} days ({len(previous)} incidents)",
        )
    )

    # severity
    if recent:
        severity_index = sum(
            SEVERITY_WEIGHT[SEVERITY_BY_CATEGORY[i["category"]]] for i in recent
        ) / len(recent)
    else:
        severity_index = 0.0
    components.append(
        RiskComponentOut(
            key="severity",
            label="Offence severity",
            points=round(severity_index * WEIGHTS["severity"], 1),
            max=float(WEIGHTS["severity"]),
            detail=f"severity index {round(severity_index * 100)}%",
        )
    )

    # repeat (pairwise within radius)
    repeat_count = 0
    for i, inc in enumerate(recent):
        for j, other in enumerate(recent):
            if i == j:
                continue
            if haversine_m((inc["lat"], inc["lng"]), (other["lat"], other["lng"])) <= REPEAT_RADIUS_M:
                repeat_count += 1
                break
    repeat_share = repeat_count / len(recent) if recent else 0.0
    components.append(
        RiskComponentOut(
            key="repeat",
            label="Repeat incidents",
            points=round(repeat_share * WEIGHTS["repeat"], 1),
            max=float(WEIGHTS["repeat"]),
            detail=f"{round(repeat_share * 100)}% within {REPEAT_RADIUS_M} m of another",
        )
    )

    # time of day
    time_contribution = (
        max(0.0, min((peak_share - 1 / PEAK_BUCKETS) / (1 - 1 / PEAK_BUCKETS), 1.0))
        if recent
        else 0.0
    )
    components.append(
        RiskComponentOut(
            key="timeOfDay",
            label="Time-of-day concentration",
            points=round(time_contribution * WEIGHTS["timeOfDay"], 1),
            max=float(WEIGHTS["timeOfDay"]),
            detail=f"{round(peak_share * 100)}% in {peak_label}",
        )
    )

    # proximity
    nearby = nearby_of(area)
    proximity = nearby / max_nearby if max_nearby else 0.0
    components.append(
        RiskComponentOut(
            key="proximity",
            label="Nearby activity",
            points=round(min(max(proximity, 0.0), 1.0) * WEIGHTS["proximity"], 1),
            max=float(WEIGHTS["proximity"]),
            detail=f"{nearby} recent incidents in adjoining localities",
        )
    )

    raw = sum(c.points for c in components)
    score = int(min(100, max(0, round(raw))))
    level = risk_level_for(score)
    return RiskZoneOut(
        id="RZ-00",
        area=area["area"],
        lat=center[0],
        lng=center[1],
        riskScore=score,
        riskLevel=level,  # type: ignore[arg-type]
        crimeCount=len(recent),
        previousCount=len(previous),
        trend=trend_for(trend_percent),  # type: ignore[arg-type]
        trendPercent=round(trend_percent),
        dominantCrime=dominant,  # type: ignore[arg-type]
        dominantShare=round(dominant_share * 100),
        peakWindow=peak_label,
        peakShare=round(peak_share * 100),
        repeatShare=round(repeat_share * 100),
        nearbyCount=nearby,
        radiusMeters=_radius_for(basis, center),
        status=status_for(level),  # type: ignore[arg-type]
        isEmerging=(not previous and bool(recent)),
        components=components,
    )


def detect_changes(
    incidents: list[dict], date_from: str, date_to: str
) -> ChangeReportOut:
    window = build_analysis_window(date_from, date_to)
    signals: list[ChangeSignalOut] = []
    by_area: dict[str, dict[str, int]] = {}
    for incident in incidents:
        dt = parse_dt(incident["occurredAt"])
        if dt is None:
            continue
        ms = dt.timestamp() * 1000
        if ms < window["previousFrom"] or ms > window["recentTo"]:
            continue
        entry = by_area.setdefault(incident["area"], {"recent": 0, "previous": 0})
        entry["recent" if ms >= window["recentFrom"] else "previous"] += 1

    recent_total = previous_total = 0
    for area, entry in sorted(by_area.items()):
        recent, previous = entry["recent"], entry["previous"]
        recent_total += recent
        previous_total += previous
        if previous == 0 and recent > 0:
            signals.append(
                ChangeSignalOut(
                    id=f"CHG-{area}-emerging",
                    kind="emerging",
                    severity="medium",
                    area=area,
                    headline=f"Emerging activity in {area}",
                    detail=f"0 incidents before, {recent} now",
                    deltaPercent=100,
                    recentCount=recent,
                    previousCount=previous,
                    category=None,
                )
            )
        elif previous > 0:
            delta = round((recent - previous) / previous * 100)
            if delta >= 25:
                signals.append(
                    ChangeSignalOut(
                        id=f"CHG-{area}-rising",
                        kind="rising",
                        severity="high",
                        area=area,
                        headline=f"Rising activity in {area}",
                        detail=f"{delta}% vs previous window",
                        deltaPercent=delta,
                        recentCount=recent,
                        previousCount=previous,
                        category=None,
                    )
                )
            elif delta <= -15:
                signals.append(
                    ChangeSignalOut(
                        id=f"CHG-{area}-declining",
                        kind="declining",
                        severity="low",
                        area=area,
                        headline=f"Declining activity in {area}",
                        detail=f"{delta}% vs previous window",
                        deltaPercent=delta,
                        recentCount=recent,
                        previousCount=previous,
                        category=None,
                    )
                )
    overall = (
        round((recent_total - previous_total) / previous_total * 100)
        if previous_total
        else (100 if recent_total else 0)
    )
    return ChangeReportOut(
        window=window,
        signals=signals,
        recentTotal=recent_total,
        previousTotal=previous_total,
        overallDeltaPercent=overall,
    )


def _units_for_level(level: str) -> int:
    return {"Critical": 3, "High": 2, "Medium": 1}.get(level, 0)


def build_recommendations(
    zones: list[RiskZoneOut], stations: list[dict], limit: int = 6
) -> list[RecommendationOut]:
    ranked = sorted(zones, key=lambda z: -z.riskScore)
    staffed = [z for z in ranked if _units_for_level(z.riskLevel) > 0]
    plan = (staffed if len(staffed) >= 3 else ranked[:3])[:limit]
    results: list[RecommendationOut] = []
    for zone in plan:
        units = _units_for_level(zone.riskLevel)
        nearest = None
        best = math.inf
        for station in stations:
            distance = haversine_m((zone.lat, zone.lng), (station["lat"], station["lng"]))
            if distance < best:
                best, nearest = distance, station
        window = "18:00-21:00" if zone.peakWindow == "—" else zone.peakWindow
        focus = FOCUS_BY_CRIME.get(zone.dominantCrime, FOCUS_BY_CRIME["Other"])
        priority = "P1" if zone.riskScore >= 75 else "P2" if zone.riskScore >= 55 else "P3"
        nearest_id = nearest["id"] if nearest else "—"
        nearest_name = nearest["name"] if nearest else "Nearest station"
        distance_m = 0 if best is math.inf else round(best)
        rationale = [
            f"{c.label} +{c.points} ({c.detail})"
            for c in sorted(zone.components, key=lambda c: -c.points)[:4]
            if c.points > 0
        ]
        results.append(
            RecommendationOut(
                zoneId=zone.id,
                area=zone.area,
                priority=priority,  # type: ignore[arg-type]
                units=units,
                window=window,
                focus=focus,
                headline=(
                    f"Deploy {units} patrol unit{'' if units == 1 else 's'} to {zone.area} during {window}"
                    if units
                    else f"Maintain routine beat coverage in {zone.area}"
                ),
                steps=[
                    f"Assign {units} unit(s) from {nearest_name} ({distance_m / 1000:.1f} km away)",
                    f"Peak focus {window} - {focus}",
                    f"{zone.crimeCount} incidents, {zone.trend.lower()} {abs(zone.trendPercent)}%",
                ],
                rationale=rationale,
                nearestStation=NearestStationOut(
                    id=nearest_id, name=nearest_name, distanceMeters=distance_m
                ),
            )
        )
    return results


def build_patrol_plan(
    zones: list[RiskZoneOut],
    stations: list[dict],
    recommendations: list[RecommendationOut],
    generated_at: str,
) -> PatrolPlanOut:
    zone_by_id = {z.id: z for z in zones}
    assigned: dict[str, int] = {}
    remaining = UNIT_COUNT
    staffed = [r for r in recommendations if r.units > 0]
    progressed = True
    while remaining > 0 and progressed:
        progressed = False
        for rec in staffed:
            if remaining <= 0:
                break
            current = assigned.get(rec.zoneId, 0)
            if current >= rec.units:
                continue
            assigned[rec.zoneId] = current + 1
            remaining -= 1
            progressed = True

    units: list[PatrolUnitOut] = []
    for rec in staffed:
        count = assigned.get(rec.zoneId, 0)
        zone = zone_by_id.get(rec.zoneId)
        if count == 0 or zone is None:
            continue
        station = next(
            (s for s in stations if s["id"] == rec.nearestStation.id),
            stations[0] if stations else None,
        )
        if station is None:
            continue
        for _ in range(count):
            index = len(units)
            units.append(
                PatrolUnitOut(
                    id=f"PU-{index + 1:02d}",
                    callsign=f"{CALLSIGNS[index % len(CALLSIGNS)]}-{index // len(CALLSIGNS) + 1}",
                    status="Deploying",
                    progress=0.0,
                    etaMinutes=0,
                    stationId=station["id"],
                    stationName=station["name"],
                    zoneId=zone.id,
                    zoneArea=zone.area,
                    lat=station["lat"],
                    lng=station["lng"],
                )
            )
    fallback = 0
    while len(units) < UNIT_COUNT and fallback < len(stations):
        index = len(units)
        station = stations[fallback]
        units.append(
            PatrolUnitOut(
                id=f"PU-{index + 1:02d}",
                callsign=f"{CALLSIGNS[index % len(CALLSIGNS)]}-{index // len(CALLSIGNS) + 1}",
                status="Standby",
                progress=0.0,
                etaMinutes=0,
                stationId=station["id"],
                stationName=station["name"],
                zoneId="",
                zoneArea="Base",
                lat=station["lat"],
                lng=station["lng"],
            )
        )
        fallback += 1

    return PatrolPlanOut(
        units=units,
        coveredZones=len({u.zoneId for u in units if u.zoneId}),
        generatedAt=generated_at,
    )
