import { CRIME_CATEGORIES } from '../types'
import type {
  AreaStat,
  CategoryStat,
  CrimeCategory,
  CrimeIncident,
  DashboardStats,
  DateRange,
  MonthPoint,
  RiskZone,
  TrendCompare,
} from '../types'
import { formatMonth } from './format'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30

function countBetween(incidents: CrimeIncident[], from: number, to: number): number {
  return incidents.filter((incident) => {
    const time = new Date(incident.occurredAt).getTime()
    return time >= from && time < to
  }).length
}

function toCompare(current: number, previous: number): TrendCompare {
  if (previous === 0) {
    return { percent: 0, direction: 'Stable', hasBaseline: false }
  }
  const percent = ((current - previous) / previous) * 100
  const direction = percent > 5 ? 'Rising' : percent < -5 ? 'Declining' : 'Stable'
  return { percent: Math.round(percent * 10) / 10, direction, hasBaseline: true }
}

/**
 * Compares the incidents inside `range` with the immediately preceding window of
 * the same length. A single-day range (from === to) therefore compares against
 * the previous day.
 */
export function computeRangeCompare(
  incidents: CrimeIncident[],
  range: DateRange,
): TrendCompare {
  const to = new Date(`${range.to}T23:59:59+05:30`).getTime()
  const from = new Date(`${range.from}T00:00:00+05:30`).getTime()
  const width = Math.max(DAY_MS, to - from)
  const previousFrom = from - width

  return toCompare(
    countBetween(incidents, from, to),
    countBetween(incidents, previousFrom, from),
  )
}

/** Rolling 30-day trend: the last 30 days of `range` vs the previous 30 days. */
export function computeTrend(incidents: CrimeIncident[], range: DateRange): TrendCompare {
  const to = new Date(`${range.to}T23:59:59+05:30`).getTime()
  const recentFrom = to - WINDOW_DAYS * DAY_MS
  const previousFrom = recentFrom - WINDOW_DAYS * DAY_MS

  return toCompare(
    countBetween(incidents, recentFrom, to),
    countBetween(incidents, previousFrom, recentFrom),
  )
}

export function computeDashboardStats(
  incidents: CrimeIncident[],
  zones: RiskZone[],
  viewRange: DateRange | null,
  fullRange: DateRange,
  compareIncidents: CrimeIncident[] = incidents,
): DashboardStats {
  const categoryCounts = incidents.reduce<Record<string, number>>((acc, incident) => {
    acc[incident.category] = (acc[incident.category] ?? 0) + 1
    return acc
  }, {})

  let mostCommonCategory: CrimeCategory | null = null
  let mostCommonCount = 0
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > mostCommonCount) {
      mostCommonCategory = category as CrimeCategory
      mostCommonCount = count
    }
  }

  // No explicit day/range -> compare the last 30 days vs the previous 30 days.
  const compare = viewRange
    ? computeRangeCompare(compareIncidents, viewRange)
    : computeTrend(compareIncidents, fullRange)
  const trend = computeTrend(compareIncidents, fullRange)
  const averageRiskScore =
    zones.length > 0
      ? Math.round(zones.reduce((sum, zone) => sum + zone.riskScore, 0) / zones.length)
      : 0

  return {
    totalIncidents: incidents.length,
    activeHotspots: zones.filter((zone) => zone.status === 'Active').length,
    emergingHotspots: zones.filter((zone) => zone.isEmerging || zone.trend === 'Rising').length,
    highRiskZones: zones.filter(
      (zone) => zone.riskLevel === 'High' || zone.riskLevel === 'Critical',
    ).length,
    averageRiskScore,
    trendPercent: trend.percent,
    trendDirection: trend.direction,
    compare,
    mostCommonCategory,
    mostCommonCount,
  }
}

export function buildCategoryStats(incidents: CrimeIncident[]): CategoryStat[] {
  const counts = new Map<CrimeCategory, number>(CRIME_CATEGORIES.map((c) => [c, 0]))
  for (const incident of incidents) {
    counts.set(incident.category, (counts.get(incident.category) ?? 0) + 1)
  }
  const total = incidents.length || 1
  return CRIME_CATEGORIES.map((category) => ({
    category,
    count: counts.get(category) ?? 0,
    share: Math.round(((counts.get(category) ?? 0) / total) * 1000) / 10,
  })).sort((a, b) => b.count - a.count)
}

export function buildMonthlySeries(
  incidents: CrimeIncident[],
  range: DateRange,
): MonthPoint[] {
  const start = new Date(`${range.from}T00:00:00+05:30`)
  const end = new Date(`${range.to}T00:00:00+05:30`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []

  const keys: string[] = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  while (cursor.getTime() <= end.getTime()) {
    keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`)
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  const counts = new Map<string, number>(keys.map((key) => [key, 0]))
  for (const incident of incidents) {
    const key = incident.occurredAt.slice(0, 7)
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return keys.map((key) => ({
    month: key,
    label: formatMonth(key),
    count: counts.get(key) ?? 0,
  }))
}

export function buildAreaStats(incidents: CrimeIncident[], limit = 8): AreaStat[] {
  const counts = new Map<string, number>()
  for (const incident of incidents) {
    counts.set(incident.area, (counts.get(incident.area) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function buildStatusStats(
  incidents: CrimeIncident[],
): { status: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const incident of incidents) {
    counts.set(incident.status, (counts.get(incident.status) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
}
