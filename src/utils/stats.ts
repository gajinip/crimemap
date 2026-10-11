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
  TrendDirection,
} from '../types'
import { formatMonth } from './format'
import { DATA_MAX_DATE } from './filters'

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

/** Per-category mix + trend used by the dashboard's two-division breakdown. */
export interface CategoryTrend {
  category: CrimeCategory
  /** Incidents of this type across the whole supplied dataset. */
  total: number
  /** Incidents in the most recent window. */
  current: number
  /** Incidents in the immediately preceding window of equal length. */
  previous: number
  percent: number | null
  direction: TrendDirection
  hasBaseline: boolean
}

/**
 * Builds a per-category current-vs-previous comparison. When `windowDays` is
 * given the two windows are a fixed rolling length (e.g. 30 days); otherwise
 * the range's own width is used, matching `computeRangeCompare`.
 */
export function buildCategoryTrends(
  incidents: CrimeIncident[],
  range: DateRange,
  windowDays?: number,
): CategoryTrend[] {
  const to = new Date(`${range.to}T23:59:59+05:30`).getTime()
  const from = new Date(`${range.from}T00:00:00+05:30`).getTime()
  const width = windowDays !== undefined ? windowDays * DAY_MS : Math.max(DAY_MS, to - from)
  const recentFrom = to - width
  const previousFrom = recentFrom - width

  return CRIME_CATEGORIES.map((category) => {
    const subset = incidents.filter((incident) => incident.category === category)
    const current = countBetween(subset, recentFrom, to)
    const previous = countBetween(subset, previousFrom, recentFrom)
    const compare = toCompare(current, previous)
    return {
      category,
      total: subset.length,
      current,
      previous,
      percent: compare.hasBaseline ? compare.percent : null,
      direction: compare.direction,
      hasBaseline: compare.hasBaseline,
    }
  })
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

// ---------------------------------------------------------------------------
// Reports / CompStat comparison metrics
// ---------------------------------------------------------------------------

const IST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const IST_DAY_MONTH = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
})

function dayStart(iso: string): number {
  const time = new Date(`${iso}T00:00:00+05:30`).getTime()
  return Number.isNaN(time) ? Date.now() : time
}

function dayEnd(iso: string): number {
  const time = new Date(`${iso}T23:59:59+05:30`).getTime()
  return Number.isNaN(time) ? Date.now() : time
}

function toIsoDate(ms: number): string {
  return IST_DATE.format(new Date(ms))
}

function addDays(iso: string, days: number): string {
  return toIsoDate(dayStart(iso) + days * DAY_MS)
}

function dayLabel(iso: string): string {
  return IST_DAY_MONTH.format(new Date(`${iso}T00:00:00+05:30`))
}

/** Latest incident date in the dataset (falls back to the demo upper bound). */
export function reportAnchor(incidents: CrimeIncident[]): string {
  let latest = ''
  for (const incident of incidents) {
    const day = incident.occurredAt.slice(0, 10)
    if (day > latest) latest = day
  }
  return latest || DATA_MAX_DATE
}

function changePercent(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** One row of the CompStat-style period comparison table. */
export interface PeriodComparisonRow {
  category: CrimeCategory
  currentWeek: number
  previousWeek: number
  changeWeek: number | null
  current28: number
  previous28: number
  change28: number | null
  currentYtd: number
  previousYtd: number
  changeYtd: number | null
}

export interface PeriodComparison {
  anchor: string
  rows: PeriodComparisonRow[]
  totals: {
    currentWeek: number
    previousWeek: number
    changeWeek: number | null
    current28: number
    previous28: number
    change28: number | null
    currentYtd: number
    previousYtd: number
    changeYtd: number | null
  }
  /** False when a previous window holds no records at all (comparison unavailable). */
  baselines: { week: boolean; d28: boolean; ytd: boolean }
}

interface Window {
  from: number
  to: number
}

function countInWindow(incidents: CrimeIncident[], window: Window, category?: CrimeCategory): number {
  let count = 0
  for (const incident of incidents) {
    if (category && incident.category !== category) continue
    const time = new Date(incident.occurredAt).getTime()
    if (Number.isNaN(time)) continue
    if (time >= window.from && time <= window.to) count += 1
  }
  return count
}

/**
 * Builds the week-over-week / 28-day / YTD comparison table anchored to the
 * latest incident date. Comparisons are only reported when the previous window
 * actually contains records; otherwise the change is `null` so the UI can show
 * "n/a" instead of fabricating a percentage.
 */
export function buildPeriodComparison(
  incidents: CrimeIncident[],
  anchor: string = reportAnchor(incidents),
): PeriodComparison {
  const year = Number(anchor.slice(0, 4))
  const monthDay = anchor.slice(4) // "-MM-DD"

  const windows = {
    currentWeek: { from: dayStart(addDays(anchor, -6)), to: dayEnd(anchor) },
    previousWeek: { from: dayStart(addDays(anchor, -13)), to: dayEnd(addDays(anchor, -7)) },
    current28: { from: dayStart(addDays(anchor, -27)), to: dayEnd(anchor) },
    previous28: { from: dayStart(addDays(anchor, -55)), to: dayEnd(addDays(anchor, -28)) },
    currentYtd: { from: dayStart(`${year}-01-01`), to: dayEnd(anchor) },
    previousYtd: {
      from: dayStart(`${year - 1}-01-01`),
      to: dayEnd(`${year - 1}${monthDay}`),
    },
  }

  const rows: PeriodComparisonRow[] = CRIME_CATEGORIES.map((category) => {
    const currentWeek = countInWindow(incidents, windows.currentWeek, category)
    const previousWeek = countInWindow(incidents, windows.previousWeek, category)
    const current28 = countInWindow(incidents, windows.current28, category)
    const previous28 = countInWindow(incidents, windows.previous28, category)
    const currentYtd = countInWindow(incidents, windows.currentYtd, category)
    const previousYtd = countInWindow(incidents, windows.previousYtd, category)
    return {
      category,
      currentWeek,
      previousWeek,
      changeWeek: changePercent(currentWeek, previousWeek),
      current28,
      previous28,
      change28: changePercent(current28, previous28),
      currentYtd,
      previousYtd,
      changeYtd: changePercent(currentYtd, previousYtd),
    }
  })

  const totals = {
    currentWeek: countInWindow(incidents, windows.currentWeek),
    previousWeek: countInWindow(incidents, windows.previousWeek),
    current28: countInWindow(incidents, windows.current28),
    previous28: countInWindow(incidents, windows.previous28),
    currentYtd: countInWindow(incidents, windows.currentYtd),
    previousYtd: countInWindow(incidents, windows.previousYtd),
    changeWeek: 0 as number | null,
    change28: 0 as number | null,
    changeYtd: 0 as number | null,
  }
  totals.changeWeek = changePercent(totals.currentWeek, totals.previousWeek)
  totals.change28 = changePercent(totals.current28, totals.previous28)
  totals.changeYtd = changePercent(totals.currentYtd, totals.previousYtd)

  return {
    anchor,
    rows,
    totals,
    baselines: {
      week: totals.previousWeek > 0,
      d28: totals.previous28 > 0,
      ytd: totals.previousYtd > 0,
    },
  }
}

/** One bucket of the report trend chart. */
export interface TrendBucket {
  key: string
  label: string
  count: number
  /** Inclusive label for tooltips, e.g. "02 Oct - 08 Oct". */
  rangeLabel: string
}

type TrendGranularity = 'day' | 'week' | 'month'

/**
 * Groups incidents into day/week/month buckets sized to the selected period.
 * Nothing is synthesised: buckets with no incidents simply report 0.
 */
export function buildTrendSeries(
  incidents: CrimeIncident[],
  range: DateRange,
): { granularity: TrendGranularity; buckets: TrendBucket[] } {
  const from = dayStart(range.from)
  const to = dayEnd(range.to)
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) {
    return { granularity: 'day', buckets: [] }
  }

  const spanDays = Math.max(1, Math.round((to - from) / DAY_MS))
  const granularity: TrendGranularity = spanDays <= 45 ? 'day' : spanDays <= 200 ? 'week' : 'month'

  if (granularity === 'month') {
    const months = buildMonthlySeries(incidents, range)
    return {
      granularity,
      buckets: months.map((point) => ({
        key: point.month,
        label: point.label,
        count: point.count,
        rangeLabel: point.label,
      })),
    }
  }

  const size = granularity === 'day' ? 1 : 7
  const bucketCount = Math.ceil(spanDays / size)
  const buckets: TrendBucket[] = Array.from({ length: bucketCount }, (_, index) => {
    const startIso = toIsoDate(from + index * size * DAY_MS)
    const endIso = toIsoDate(from + (Math.min((index + 1) * size, spanDays + 1) - 1) * DAY_MS)
    return {
      key: startIso,
      label: dayLabel(startIso),
      count: 0,
      rangeLabel: size === 1 ? dayLabel(startIso) : `${dayLabel(startIso)} - ${dayLabel(endIso)}`,
    }
  })

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  for (const incident of incidents) {
    const time = new Date(incident.occurredAt).getTime()
    if (Number.isNaN(time) || time < from || time > to) continue
    const index = Math.floor((time - from) / (size * DAY_MS))
    const key = toIsoDate(from + index * size * DAY_MS)
    const bucket = byKey.get(key)
    if (bucket) bucket.count += 1
  }

  return { granularity, buckets }
}
