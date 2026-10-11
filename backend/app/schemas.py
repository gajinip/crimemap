"""Pydantic response/request schemas.

Field names deliberately match the TypeScript interfaces in the React app's
`src/types/index.ts` (camelCase) so the two contracts are interchangeable.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CrimeCategory = Literal[
    "Theft",
    "Robbery",
    "Assault",
    "Burglary",
    "Vehicle Theft",
    "Fraud",
    "Other",
]
IncidentStatus = Literal["Reported", "Under Investigation", "Closed"]
RiskLevel = Literal["Low", "Medium", "High", "Critical"]
TrendDirection = Literal["Rising", "Stable", "Declining"]
HotspotStatus = Literal["Active", "Monitoring", "Contained"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IncidentOut(ORMModel):
    id: str
    lat: float
    lng: float
    category: CrimeCategory
    occurredAt: str
    area: str
    description: str
    status: IncidentStatus
    isDemo: bool = True


class StationOut(ORMModel):
    id: str
    name: str
    lat: float
    lng: float
    area: str
    jurisdiction: list[str]
    isDemo: bool = True


class RiskComponentOut(BaseModel):
    key: str
    label: str
    points: float
    max: float
    detail: str


class RiskZoneOut(BaseModel):
    id: str
    area: str
    lat: float
    lng: float
    riskScore: int
    riskLevel: RiskLevel
    crimeCount: int
    previousCount: int
    trend: TrendDirection
    trendPercent: int
    dominantCrime: CrimeCategory
    dominantShare: int
    peakWindow: str
    peakShare: int
    repeatShare: int
    nearbyCount: int
    radiusMeters: int
    status: HotspotStatus
    isEmerging: bool
    components: list[RiskComponentOut]
    isDemo: bool = True


class RiskPredictionOut(BaseModel):
    zoneId: str
    area: str
    riskScore: int
    riskLevel: RiskLevel
    expectedIncidents: float | None = None
    confidence: float
    contributingFactors: list[str]
    modelVersion: str
    generatedAt: str
    isDemo: bool = True


class RiskForecastOut(BaseModel):
    predictions: list[RiskPredictionOut]
    isDemo: bool = True


class ChangeSignalOut(BaseModel):
    id: str
    kind: Literal["rising", "emerging", "declining"]
    severity: Literal["high", "medium", "low"]
    area: str
    headline: str
    detail: str
    deltaPercent: int
    recentCount: int
    previousCount: int
    category: CrimeCategory | None = None


class ChangeReportOut(BaseModel):
    window: dict
    signals: list[ChangeSignalOut]
    recentTotal: int
    previousTotal: int
    overallDeltaPercent: int
    isDemo: bool = True


class NearestStationOut(BaseModel):
    id: str
    name: str
    distanceMeters: int


class RecommendationOut(BaseModel):
    zoneId: str
    area: str
    priority: Literal["P1", "P2", "P3"]
    units: int
    window: str
    focus: str
    headline: str
    steps: list[str]
    rationale: list[str]
    nearestStation: NearestStationOut
    isDemo: bool = True


class PatrolUnitOut(BaseModel):
    id: str
    callsign: str
    status: Literal["Standby", "Deploying", "Patrolling"]
    progress: float
    etaMinutes: int
    stationId: str
    stationName: str
    zoneId: str
    zoneArea: str
    lat: float
    lng: float


class PatrolPlanOut(BaseModel):
    units: list[PatrolUnitOut]
    coveredZones: int
    generatedAt: str
    isDemo: bool = True


class CategoryStatOut(BaseModel):
    category: CrimeCategory
    count: int
    share: float


class AreaStatOut(BaseModel):
    area: str
    count: int


class MonthPointOut(BaseModel):
    month: str
    label: str
    count: int


class BBox(BaseModel):
    min_lng: float
    min_lat: float
    max_lng: float
    max_lat: float


class IncidentQuery(BaseModel):
    area: str | None = None
    category: CrimeCategory | None = None
    status: IncidentStatus | None = None
    date_from: str | None = None
    date_to: str | None = None
    min_lng: float | None = None
    min_lat: float | None = None
    max_lng: float | None = None
    max_lat: float | None = None
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)
