/**
 * Shared domain types for CRIMEMAP.
 *
 * These interfaces are intentionally backend-agnostic so the mock data layer in
 * `src/data` can later be swapped for a PostgreSQL + PostGIS + FastAPI service
 * without touching UI components.
 */

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'

export type CrimeCategory =
  | 'Theft'
  | 'Robbery'
  | 'Assault'
  | 'Burglary'
  | 'Vehicle Theft'
  | 'Fraud'
  | 'Other'

export type IncidentStatus = 'Reported' | 'Under Investigation' | 'Closed'

export type TrendDirection = 'Rising' | 'Stable' | 'Declining'

export type HotspotStatus = 'Active' | 'Monitoring' | 'Contained'

export type OffenderGender = 'Male' | 'Female' | 'Other' | 'Unknown'

export type OffenderStatus = 'Wanted' | 'Arrested' | 'Under Investigation' | 'Unknown'

/** Details about the person linked to an incident, when known. */
export interface IncidentOffender {
  name: string
  alias: string | null
  age: number | null
  gender: OffenderGender
  status: OffenderStatus
  description: string
  /** True for generated demo records; false for operator-entered ones. */
  isDemo: boolean
}

/** A timestamped case note posted against an incident (report updater). */
export interface IncidentUpdate {
  id: string
  at: string
  note: string
  /** Optional status transition recorded alongside the update. */
  status: IncidentStatus | null
  /** Author label (officer name, or the demo analyst). */
  by: string
}

export const RISK_LEVELS: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical']

export const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical']

export const INCIDENT_STATUSES: IncidentStatus[] = [
  'Reported',
  'Under Investigation',
  'Closed',
]

export const CRIME_CATEGORIES: CrimeCategory[] = [
  'Theft',
  'Robbery',
  'Assault',
  'Burglary',
  'Vehicle Theft',
  'Fraud',
  'Other',
]

export interface GeoPoint {
  lat: number
  lng: number
}

/** A single (demo) crime incident plotted on the map. */
export interface CrimeIncident extends GeoPoint {
  id: string
  category: CrimeCategory
  occurredAt: string
  area: string
  description: string
  status: IncidentStatus
  /** Always true for bundled records; a live API would return false. */
  isDemo: boolean
  /** Linked suspect/offender details, when known. */
  offender?: IncidentOffender
  /** Evidence photo as a data URL or remote URL, when attached. */
  imageUrl?: string
  /** Extra free-text case notes beyond the short description. */
  caseNotes?: string
  /** Chronological report updates posted against this incident. */
  updates?: IncidentUpdate[]
}

/** A police station with jurisdiction over one or more localities. */
export interface PoliceStation extends GeoPoint {
  id: string
  name: string
  area: string
  jurisdiction: string[]
  isDemo: boolean
}

/** One weighted factor that adds up to the 0-100 zone risk score. */
export interface RiskComponent {
  key: 'frequency' | 'trend' | 'severity' | 'repeat' | 'timeOfDay' | 'proximity'
  label: string
  /** Points this factor contributed to the overall score. */
  points: number
  /** Maximum points this factor can ever contribute. */
  max: number
  /** Human-readable evidence behind the points. */
  detail: string
}

/**
 * A dynamically detected risk zone, derived from incident data by the
 * deterministic scoring engine in `src/analytics/risk.ts`.
 */
export interface RiskZone extends GeoPoint {
  id: string
  area: string
  /** 0-100 weighted score, explainable via `components`. */
  riskScore: number
  riskLevel: RiskLevel
  /** Incidents inside the recent analysis window. */
  crimeCount: number
  /** Incidents inside the immediately preceding window. */
  previousCount: number
  trend: TrendDirection
  trendPercent: number
  dominantCrime: CrimeCategory
  dominantShare: number
  /** Peak 3-hour block, e.g. "20:00-23:00". */
  peakWindow: string
  /** Share of recent incidents inside the peak window. */
  peakShare: number
  /** Share of recent incidents within 250 m of another recent incident. */
  repeatShare: number
  /** Recent incidents in adjoining localities. */
  nearbyCount: number
  radiusMeters: number
  status: HotspotStatus
  /** True when the zone had no incidents in the previous window. */
  isEmerging: boolean
  components: RiskComponent[]
  isDemo: boolean
}

/**
 * Which dataset a downstream computation (recommendation, patrol plan) was
 * built from: the measured risk zones, or the forward-adjusted prediction view.
 */
export type PredictionSource = 'predicted' | 'measured'

/** One explainable component of a zone's forward score adjustment. */
export interface PredictionAdjustment {
  key: 'emerging' | 'trend' | 'confidence'
  label: string
  /** Signed points this signal (after confidence blending) added to the score. */
  points: number
  /** Human-readable evidence behind the adjustment. */
  detail: string
}

/**
 * A risk zone extended with a conservative, explainable forward view.
 *
 * `riskScore`/`riskLevel` are overridden with the predicted values so every
 * existing consumer (recommendations, patrol, cards) automatically works on the
 * forward view. The measured values remain available in `baseScore`/`baseLevel`
 * and every movement is broken down in `adjustments`/`rationale`.
 */
export interface PredictedRiskZone extends RiskZone {
  baseScore: number
  baseLevel: RiskLevel
  predictedScore: number
  predictedLevel: RiskLevel
  /** Signed movement applied to the measured score (predicted - base). */
  adjustment: number
  /** 0-1 heuristic confidence in the zone's data coverage. */
  confidence: number
  adjustments: PredictionAdjustment[]
  rationale: string[]
}

/** The full predicted zone view plus the metadata needed to label it. */
export interface PredictionResult {
  zones: PredictedRiskZone[]
  source: PredictionSource
  modelVersion: string
}

/** The recent/previous comparison windows used across the analytics engine. */
export interface AnalysisWindow {
  days: number
  recentFrom: number
  recentTo: number
  previousFrom: number
  previousTo: number
  recentLabel: string
  previousLabel: string
}

export type ChangeKind = 'rising' | 'emerging' | 'declining'

/** A significant difference between the recent and previous windows. */
export interface ChangeSignal {
  id: string
  kind: ChangeKind
  /** Display urgency: high (rise), medium (emerging), low (decline). */
  severity: 'high' | 'medium' | 'low'
  area: string
  headline: string
  detail: string
  deltaPercent: number
  recentCount: number
  previousCount: number
  category: CrimeCategory | null
}

export interface ChangeReport {
  window: AnalysisWindow
  signals: ChangeSignal[]
  recentTotal: number
  previousTotal: number
  overallDeltaPercent: number
  isDemo: boolean
}

/** Operational recommendation produced for a single risk zone. */
export interface Recommendation {
  zoneId: string
  area: string
  priority: 'P1' | 'P2' | 'P3'
  /** Suggested additional patrol strength for the zone. */
  units: number
  /** Focus window derived from the zone's peak hours. */
  window: string
  /** Patrol focus derived from the dominant crime type. */
  focus: string
  headline: string
  steps: string[]
  rationale: string[]
  nearestStation: { id: string; name: string; distanceMeters: number }
  /** Present when the recommendation was derived from the predicted view. */
  prediction?: RecommendationPrediction
  isDemo: boolean
}

/** Forward-view context attached to a recommendation built from predictions. */
export interface RecommendationPrediction {
  source: PredictionSource
  /** Signed forward adjustment applied to the zone's measured score. */
  adjustment: number
  /** 0-1 heuristic confidence behind the adjustment. */
  confidence: number
  rationale: string[]
}

export type PatrolStatus = 'Standby' | 'Deploying' | 'Patrolling'

/** A simulated patrol vehicle with a route from its base to an assigned zone. */
export interface PatrolUnit extends GeoPoint {
  id: string
  callsign: string
  status: PatrolStatus
  /** 0-1 position along the unit route. */
  progress: number
  etaMinutes: number
  stationId: string
  stationName: string
  zoneId: string
  zoneArea: string
  route: GeoPoint[]
}

export interface PatrolPlan {
  units: PatrolUnit[]
  coveredZones: number
  generatedAt: string
  isDemo: boolean
}

export interface AssistantAnswer {
  text: string
  sources: string[]
  suggestions: string[]
}

/** Feature families used by the explainable crime-linkage model. */
export type LinkFeatureKey =
  | 'offender'
  | 'category'
  | 'proximity'
  | 'time'
  | 'mo'
  | 'area'
  | 'timeOfDay'
  | 'window'

/** One weighted feature that contributes to a pair's association score. */
export interface LinkFeature {
  key: LinkFeatureKey
  label: string
  /** 0-1 normalised strength of this feature for the pair. */
  strength: number
  /** Model weight before renormalisation. */
  weight: number
  /** Points this feature contributed to the final 0-100 score. */
  points: number
  /** Human-readable evidence behind the feature. */
  detail: string
}

/** A scored relationship between two incidents, with every reason itemised. */
export interface IncidentLink {
  id: string
  a: string
  b: string
  /** 0-100 association strength. */
  score: number
  strength: 'strong' | 'moderate' | 'weak'
  distanceMeters: number
  hoursApart: number
  sameCategory: boolean
  sameArea: boolean
  /** Shared suspect name when both records name the same person. */
  sharedOffender: string | null
  /** True when the two incidents sit on opposite sides of the compare window. */
  crossWindow: boolean
  features: LinkFeature[]
  rationale: string[]
}

/** A connected group of incidents the model considers one network. */
export interface LinkCluster {
  id: string
  incidentIds: string[]
  size: number
  areas: string[]
  categories: CrimeCategory[]
  dominantCategory: CrimeCategory
  sharedOffender: string | null
  earliest: string
  latest: string
  /** Mean association score across the cluster's links. */
  score: number
  strength: 'strong' | 'moderate' | 'weak'
  rationale: string[]
}

/** Incidents the model attributes to the same (known) person. */
export interface RepeatSuspect {
  name: string
  incidentIds: string[]
  areas: string[]
  categories: CrimeCategory[]
  count: number
  earliest: string
  latest: string
}

/** Full output of the crime-linkage model. */
export interface LinkAnalysisResult {
  modelVersion: string
  generatedAt: string
  links: IncidentLink[]
  clusters: LinkCluster[]
  repeatSuspects: RepeatSuspect[]
  /** Incidents the model compared. */
  scanned: number
  /** Pairs that cleared the linking threshold. */
  linkedPairs: number
  isDemo: boolean
}

/**
 * Contract for the future ML risk service.
 * Endpoint shape: GET /api/v1/risk/forecast -> RiskForecastResponse
 *
 * The bundled build computes these values client-side with a deterministic,
 * explainable scoring engine. No probabilistic model is executed.
 */
export interface RiskPrediction {
  zoneId: string
  area: string
  risk_score: number
  risk_level: RiskLevel
  confidence: number
  contributing_factors: string[]
  modelVersion: string
  generatedAt: string
  isDemo: boolean
}

export interface RiskForecastResponse {
  predictions: RiskPrediction[]
  isDemo: boolean
}

export interface DateRange {
  from: string
  to: string
}

export interface AreaOption {
  name: string
}

export interface CrimeFilterState {
  categories: CrimeCategory[]
  riskLevels: RiskLevel[]
  severities: Severity[]
  statuses: IncidentStatus[]
  area: string
  dateRange: DateRange
  searchQuery: string
}

export type ComparePeriod = 'Day' | 'Week' | 'Month' | 'Year' | 'Total'

export interface TrendCompare {
  percent: number
  direction: TrendDirection
  hasBaseline: boolean
}

export interface DashboardStats {
  totalIncidents: number
  activeHotspots: number
  emergingHotspots: number
  highRiskZones: number
  averageRiskScore: number
  trendPercent: number
  trendDirection: TrendDirection
  compare: TrendCompare
  mostCommonCategory: CrimeCategory | null
  mostCommonCount: number
}

export interface CategoryStat {
  category: CrimeCategory
  count: number
  share: number
}

export interface AreaStat {
  area: string
  count: number
}

export interface MonthPoint {
  month: string
  label: string
  count: number
}

/** Sidebar navigation targets. */
export type AppView =
  | 'dashboard'
  | 'map'
  | 'hotspots'
  | 'trends'
  | 'intelligence'
  | 'predictive-risk'
  | 'patrol'
  | 'stations'
  | 'reports'
