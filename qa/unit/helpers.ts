import type {
  CrimeCategory,
  CrimeFilterState,
  CrimeIncident,
  IncidentStatus,
  RiskLevel,
  RiskZone,
  Severity,
} from "../../src/types";

export const ALL_CATEGORIES: CrimeCategory[] = [
  "Theft",
  "Robbery",
  "Assault",
  "Burglary",
  "Vehicle Theft",
  "Fraud",
  "Other",
];

export const ALL_RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
export const ALL_SEVERITIES: Severity[] = ["Low", "Medium", "High", "Critical"];
export const ALL_STATUSES: IncidentStatus[] = ["Reported", "Under Investigation", "Closed"];

export const FULL_RANGE = { from: "2026-04-01", to: "2026-10-08" };

export function defaultFilters(overrides: Partial<CrimeFilterState> = {}): CrimeFilterState {
  return {
    categories: ALL_CATEGORIES,
    riskLevels: ALL_RISK_LEVELS,
    severities: ALL_SEVERITIES,
    statuses: ALL_STATUSES,
    area: "All Areas",
    dateRange: FULL_RANGE,
    searchQuery: "",
    ...overrides,
  };
}

let sequence = 0;

export function makeIncident(overrides: Partial<CrimeIncident> = {}): CrimeIncident {
  sequence += 1;
  return {
    id: `INC-${String(sequence).padStart(3, "0")}`,
    lat: 26.85,
    lng: 80.94,
    category: "Theft",
    occurredAt: "2026-10-05T21:30:00+05:30",
    area: "Area A",
    description: "synthetic test incident",
    status: "Reported",
    isDemo: true,
    ...overrides,
  };
}

export function makeZone(overrides: Partial<RiskZone> = {}): RiskZone {
  return {
    id: "RZ-01",
    area: "Area A",
    lat: 26.85,
    lng: 80.94,
    riskScore: 60,
    riskLevel: "High",
    crimeCount: 4,
    previousCount: 2,
    trend: "Rising",
    trendPercent: 100,
    dominantCrime: "Robbery",
    dominantShare: 75,
    peakWindow: "21:00-00:00",
    peakShare: 50,
    repeatShare: 25,
    nearbyCount: 3,
    radiusMeters: 500,
    status: "Active",
    isEmerging: false,
    components: [],
    isDemo: true,
    ...overrides,
  };
}