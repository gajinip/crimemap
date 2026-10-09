import type {
  AnalysisWindow,
  CrimeCategory,
  CrimeIncident,
  DateRange,
  RiskComponent,
  RiskForecastResponse,
  RiskLevel,
  RiskPrediction,
  RiskZone,
  TrendDirection,
} from '../types'
import { centroid, haversineMeters, maxDistanceMeters } from '../utils/geo'
import { CATEGORY_SEVERITY, SEVERITY_WEIGHT } from '../utils/severity'

/**
 * Deterministic, explainable risk scoring.
 *
 * Every zone score is a weighted sum of six measurable factors that each
 * contribute a visible number of points, so the UI can always show *why* a
 * zone scored what it scored. No randomness, no model, no black box.
 *
 *   frequency   recent incident volume vs the busiest locality   0-30
 *   trend       change vs the previous equal-length window       0-20
 *   severity    crime-type weighting of recent incidents         0-15
 *   repeat      spatial repeats (within 250 m of another)        0-15
 *   timeOfDay   concentration inside the peak 3-hour block       0-10
 *   proximity   activity in adjoining localities                 0-10
 */

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_WINDOW_DAYS = 30
const MIN_WINDOW_DAYS = 7

const WEIGHTS = {
  frequency: 30,
  trend: 20,
  severity: 15,
  repeat: 15,
  timeOfDay: 10,
  proximity: 10,
} as const

const REPEAT_RADIUS_M = 250
const NEARBY_RADIUS_M = 3000
const PEAK_BUCKETS = 8

const LABEL_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  timeZone: 'Asia/Kolkata',
})

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

function startOfDay(iso: string): number {
  const time = new Date(`${iso}T00:00:00+05:30`).getTime()
  return Number.isNaN(time) ? Date.now() : time
}

function endOfDay(iso: string): number {
  const time = new Date(`${iso}T23:59:59+05:30`).getTime()
  return Number.isNaN(time) ? Date.now() : time
}

export function formatWindowLabel(time: number): string {
  return LABEL_FORMAT.format(new Date(time))
}

/**
 * Builds the recent vs previous comparison windows for a date range.
 * The recent window covers the last (up to) 30 days of the range so a short
 * "last 7 days" filter still compares against an equal previous 7 days.
 */
export function buildAnalysisWindow(range: DateRange): AnalysisWindow {
  const to = endOfDay(range.to)
  const from = startOfDay(range.from)
  const spanDays = Math.max(MIN_WINDOW_DAYS, Math.round((to - from) / DAY_MS))
  const days = clamp(spanDays, MIN_WINDOW_DAYS, MAX_WINDOW_DAYS)

  const recentTo = to
  const recentFrom = recentTo - days * DAY_MS
  const previousTo = recentFrom
  const previousFrom = previousTo - days * DAY_MS

  return {
    days,
    recentFrom,
    recentTo,
    previousFrom,
    previousTo,
    recentLabel: `${formatWindowLabel(recentFrom)} - ${formatWindowLabel(recentTo)}`,
    previousLabel: `${formatWindowLabel(previousFrom)} - ${formatWindowLabel(previousTo)}`,
  }
}

/** Local hour recorded on the incident (dataset uses a fixed +05:30 offset). */
export function hourOf(incident: CrimeIncident): number {
  const hour = Number(incident.occurredAt.slice(11, 13))
  return Number.isFinite(hour) ? hour : 12
}

export function peakWindowOf(incidents: CrimeIncident[]): {
  label: string
  share: number
  count: number
} {
  if (incidents.length === 0) return { label: '—', share: 0, count: 0 }

  const buckets = new Array<number>(PEAK_BUCKETS).fill(0)
  for (const incident of incidents) {
    buckets[Math.floor(hourOf(incident) / 3)] += 1
  }

  let bestIndex = 0
  let bestCount = buckets[0]
  for (let index = 1; index < buckets.length; index += 1) {
    if (buckets[index] > bestCount) {
      bestCount = buckets[index]
      bestIndex = index
    }
  }

  const startHour = bestIndex * 3
  const endHour = (startHour + 3) % 24
  const label = `${String(startHour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`
  return { label, share: bestCount / incidents.length, count: bestCount }
}

export function riskLevelFor(score: number): RiskLevel {
  if (score >= 75) return 'Critical'
  if (score >= 55) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}

export function statusFor(level: RiskLevel): RiskZone['status'] {
  if (level === 'Critical' || level === 'High') return 'Active'
  if (level === 'Medium') return 'Monitoring'
  return 'Contained'
}

export function trendFor(percent: number): TrendDirection {
  if (percent > 5) return 'Rising'
  if (percent < -5) return 'Declining'
  return 'Stable'
}

function dominantCategoryOf(incidents: CrimeIncident[]): {
  category: CrimeCategory
  share: number
} {
  const counts = new Map<CrimeCategory, number>()
  for (const incident of incidents) {
    counts.set(incident.category, (counts.get(incident.category) ?? 0) + 1)
  }
  let category: CrimeCategory = 'Other'
  let max = 0
  for (const [key, value] of counts) {
    if (value > max) {
      max = value
      category = key
    }
  }
  return { category, share: incidents.length > 0 ? max / incidents.length : 0 }
}

interface AreaBucket {
  area: string
  recent: CrimeIncident[]
  previous: CrimeIncident[]
  windowed: CrimeIncident[]
  center: { lat: number; lng: number }
}

function buildBuckets(incidents: CrimeIncident[], window: AnalysisWindow): AreaBucket[] {
  const byArea = new Map<string, { recent: CrimeIncident[]; previous: CrimeIncident[] }>()

  for (const incident of incidents) {
    const time = new Date(incident.occurredAt).getTime()
    if (Number.isNaN(time) || time < window.previousFrom || time > window.recentTo) continue

    let bucket = byArea.get(incident.area)
    if (!bucket) {
      bucket = { recent: [], previous: [] }
      byArea.set(incident.area, bucket)
    }
    if (time >= window.recentFrom) bucket.recent.push(incident)
    else bucket.previous.push(incident)
  }

  const buckets: AreaBucket[] = []
  for (const [area, entry] of byArea) {
    const windowed = [...entry.previous, ...entry.recent]
    const center = centroid(windowed)
    if (!center) continue
    buckets.push({ area, recent: entry.recent, previous: entry.previous, windowed, center })
  }
  return buckets
}

function radiusFor(incidents: CrimeIncident[], center: { lat: number; lng: number }): number {
  if (incidents.length === 0) return 450
  const spread = maxDistanceMeters(center, incidents)
  const radius = Math.round((Math.max(spread, 80) * 1.5) / 50) * 50
  return clamp(radius, 350, 800)
}

function nearbyRecentOf(bucket: AreaBucket, buckets: AreaBucket[]): number {
  let nearby = 0
  for (const other of buckets) {
    if (other.area === bucket.area) continue
    if (haversineMeters(bucket.center, other.center) > NEARBY_RADIUS_M) continue
    nearby += other.recent.length
  }
  return nearby
}

function scoreBucket(
  bucket: AreaBucket,
  buckets: AreaBucket[],
  window: AnalysisWindow,
  reference: { maxRecent: number; maxNearby: number },
): RiskZone {
  const { recent, previous, center, area } = bucket
  const basis = recent.length > 0 ? recent : previous
  const dominant = dominantCategoryOf(basis)
  const peak = peakWindowOf(basis)
  const components: RiskComponent[] = []

  // --- frequency ---------------------------------------------------------
  const freqRatio = reference.maxRecent > 0 ? recent.length / reference.maxRecent : 0
  components.push({
    key: 'frequency',
    label: 'Recent incidents',
    points: round1(clamp(freqRatio, 0, 1) * WEIGHTS.frequency),
    max: WEIGHTS.frequency,
    detail:
      recent.length === 0
        ? `No incidents in the last ${window.days} days`
        : `${recent.length} incidents in ${window.days} days (${round1((recent.length / window.days) * 7)} per week)`,
  })

  // --- trend -------------------------------------------------------------
  let trendPercent = 0
  if (previous.length === 0) {
    trendPercent = recent.length > 0 ? 100 : 0
  } else {
    trendPercent = ((recent.length - previous.length) / previous.length) * 100
  }
  const growth = previous.length === 0 ? (recent.length > 0 ? 1 : 0) : clamp(trendPercent / 100, 0, 1)
  const trendDetail =
    previous.length === 0 && recent.length > 0
      ? `New activity: 0 incidents before, ${recent.length} now`
      : `${trendPercent > 0 ? '+' : ''}${Math.round(trendPercent)}% vs previous ${window.days} days (${previous.length} incidents)`
  components.push({
    key: 'trend',
    label: 'Trend vs previous period',
    points: round1(growth * WEIGHTS.trend),
    max: WEIGHTS.trend,
    detail: trendDetail,
  })

  // --- severity ----------------------------------------------------------
  const severityIndex =
    recent.length > 0
      ? recent.reduce((sum, incident) => sum + SEVERITY_WEIGHT[CATEGORY_SEVERITY[incident.category]], 0) /
        recent.length
      : 0
  const seriousShare =
    recent.length > 0
      ? recent.filter((incident) => {
          const severity = CATEGORY_SEVERITY[incident.category]
          return severity === 'High' || severity === 'Critical'
        }).length / recent.length
      : 0
  components.push({
    key: 'severity',
    label: 'Offence severity',
    points: round1(severityIndex * WEIGHTS.severity),
    max: WEIGHTS.severity,
    detail:
      recent.length > 0
        ? `${Math.round(seriousShare * 100)}% high / critical offences (severity index ${Math.round(severityIndex * 100)}%)`
        : 'No recent incidents to grade',
  })

  // --- repeat / spatial concentration ------------------------------------
  let repeatCount = 0
  for (let i = 0; i < recent.length; i += 1) {
    for (let j = 0; j < recent.length; j += 1) {
      if (i === j) continue
      if (haversineMeters(recent[i], recent[j]) <= REPEAT_RADIUS_M) {
        repeatCount += 1
        break
      }
    }
  }
  const repeatShare = recent.length > 0 ? repeatCount / recent.length : 0
  components.push({
    key: 'repeat',
    label: 'Repeat incidents',
    points: round1(repeatShare * WEIGHTS.repeat),
    max: WEIGHTS.repeat,
    detail:
      recent.length > 0
        ? `${Math.round(repeatShare * 100)}% of recent incidents occurred within ${REPEAT_RADIUS_M} m of another`
        : 'No recent incidents',
  })

  // --- time-of-day concentration -----------------------------------------
  const timeContribution =
    recent.length > 0 ? clamp((peak.share - 1 / PEAK_BUCKETS) / (1 - 1 / PEAK_BUCKETS), 0, 1) : 0
  components.push({
    key: 'timeOfDay',
    label: 'Time-of-day concentration',
    points: round1(timeContribution * WEIGHTS.timeOfDay),
    max: WEIGHTS.timeOfDay,
    detail:
      recent.length > 0
        ? `${Math.round(peak.share * 100)}% of recent incidents fall in ${peak.label}`
        : 'No recent incidents',
  })

  // --- nearby activity ---------------------------------------------------
  const nearby = nearbyRecentOf(bucket, buckets)
  const proximityContribution = reference.maxNearby > 0 ? nearby / reference.maxNearby : 0
  components.push({
    key: 'proximity',
    label: 'Nearby activity',
    points: round1(clamp(proximityContribution, 0, 1) * WEIGHTS.proximity),
    max: WEIGHTS.proximity,
    detail: `${nearby} recent incidents in adjoining localities (within ${NEARBY_RADIUS_M / 1000} km)`,
  })

  const rawScore = components.reduce((sum, component) => sum + component.points, 0)
  const riskScore = clamp(Math.round(rawScore), 0, 100)
  const riskLevel = riskLevelFor(riskScore)
  const previousCount = previous.length
  const isEmerging = previousCount === 0 && recent.length > 0

  return {
    id: 'RZ-PLACEHOLDER',
    area,
    lat: center.lat,
    lng: center.lng,
    riskScore,
    riskLevel,
    crimeCount: recent.length,
    previousCount,
    trend: trendFor(trendPercent),
    trendPercent: Math.round(trendPercent),
    dominantCrime: dominant.category,
    dominantShare: Math.round(dominant.share * 100),
    peakWindow: peak.label,
    peakShare: Math.round(peak.share * 100),
    repeatShare: Math.round(repeatShare * 100),
    nearbyCount: nearby,
    radiusMeters: radiusFor(basis, center),
    status: statusFor(riskLevel),
    isEmerging,
    components,
    isDemo: true,
  }
}

/**
 * Detects risk zones from raw incidents for a date range.
 * Result is deterministically sorted by score (then area) and re-indexed.
 */
export function computeRiskZones(
  incidents: CrimeIncident[],
  range: DateRange,
): RiskZone[] {
  const window = buildAnalysisWindow(range)
  const buckets = buildBuckets(incidents, window)
  if (buckets.length === 0) return []

  const maxRecent = Math.max(8, ...buckets.map((bucket) => bucket.recent.length))
  const maxNearby = Math.max(
    1,
    ...buckets.map((bucket) => nearbyRecentOf(bucket, buckets)),
  )

  const zones = buckets.map((bucket) => scoreBucket(bucket, buckets, window, { maxRecent, maxNearby }))

  zones.sort((a, b) => b.riskScore - a.riskScore || a.area.localeCompare(b.area))
  return zones.map((zone, index) => ({
    ...zone,
    id: `RZ-${String(index + 1).padStart(2, '0')}`,
  }))
}

/** Maps the same contract the future ML endpoint would return. */
export function buildRiskForecast(
  zones: RiskZone[],
  generatedAt: string,
): RiskForecastResponse {
  const predictions: RiskPrediction[] = zones.map((zone) => ({
    zoneId: zone.id,
    area: zone.area,
    risk_score: zone.riskScore,
    risk_level: zone.riskLevel,
    confidence: Math.round(clamp(0.4 + (Math.min(zone.crimeCount, 20) / 20) * 0.5, 0.4, 0.9) * 100) / 100,
    contributing_factors: zone.components
      .filter((component) => component.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 4)
      .map((component) => `${component.label}: ${component.detail}`),
    modelVersion: 'crimemap-risk-engine-v1',
    generatedAt,
    isDemo: true,
  }))
  return { predictions, isDemo: true }
}
