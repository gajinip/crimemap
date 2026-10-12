import type { CrimeCategory, CrimeIncident, DateRange } from '../types'
import { buildCategoryTrends, buildMonthlySeries } from './stats'

/** A named count with its share of a parent total, rounded to one decimal. */
export interface CountShare {
  name: string
  count: number
  share: number
}

/** A simple label/count bucket used for temporal and monthly distributions. */
export interface CountBucket {
  label: string
  count: number
}

/**
 * Everything the crime-category detail panel needs, derived purely from the
 * filtered incident list for a single category. Kept separate from the UI so the
 * shape can be unit-tested and the demo dataset can later be swapped for a real
 * service without touching the view code.
 */
export interface CategoryDetail {
  category: CrimeCategory
  total: number
  /** Share of this category within all filtered incidents (%). */
  overallShare: number
  /** Incidents in the most recent window of the range. */
  current: number
  /** Incidents in the immediately preceding window of equal length. */
  previous: number
  changePercent: number | null
  hasBaseline: boolean
  areas: CountShare[]
  topArea: CountShare | null
  lowestArea: CountShare | null
  monthly: CountBucket[]
  peakMonth: CountBucket | null
  byDay: CountBucket[]
  peakDay: CountBucket | null
  byHour: CountBucket[]
  peakHour: CountBucket | null
  statuses: CountShare[]
  /** Reported + Under Investigation. */
  pending: number
  /** Closed. */
  cleared: number
}

// Weekday and hour are read in IST to match how the demo timestamps are stored
// (+05:30) rather than the viewer's local timezone.
const IST_WEEKDAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
})
const IST_HOUR = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  hourCycle: 'h23',
})

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Four six-hour bands keep the hour-of-day view readable on small screens.
const HOUR_BLOCKS: { label: string; from: number; to: number }[] = [
  { label: '00–06', from: 0, to: 5 },
  { label: '06–12', from: 6, to: 11 },
  { label: '12–18', from: 12, to: 17 },
  { label: '18–24', from: 18, to: 23 },
]

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function weekdayIndex(iso: string): number {
  const index = WEEKDAYS.indexOf(IST_WEEKDAY.format(new Date(iso)))
  return index >= 0 ? index : 0
}

function hourValue(iso: string): number {
  const value = Number.parseInt(IST_HOUR.format(new Date(iso)), 10)
  return Number.isNaN(value) ? 0 : value
}

/** Largest-count bucket, or null when every bucket is empty. */
function peakBucket(buckets: CountBucket[]): CountBucket | null {
  let best: CountBucket | null = null
  for (const bucket of buckets) {
    if (bucket.count > 0 && (best === null || bucket.count > best.count)) best = bucket
  }
  return best
}

function toShares(counts: Map<string, number>, total: number): CountShare[] {
  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      share: total > 0 ? round1((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Builds the detail view for one category: period change, geographic spread,
 * monthly/temporal patterns, case status and concentration. Missing dimensions
 * (e.g. subtypes, prior-year data) are simply absent so the UI can state them as
 * unavailable rather than inventing values.
 */
export function buildCategoryDetail(
  incidents: CrimeIncident[],
  category: CrimeCategory,
  range: DateRange,
): CategoryDetail {
  const subset = incidents.filter((incident) => incident.category === category)
  const total = subset.length

  const trend = buildCategoryTrends(incidents, range).find((row) => row.category === category)

  const areaCounts = new Map<string, number>()
  for (const incident of subset) {
    areaCounts.set(incident.area, (areaCounts.get(incident.area) ?? 0) + 1)
  }
  const areas = toShares(areaCounts, total)

  const monthly = buildMonthlySeries(subset, range).map((point) => ({
    label: point.label,
    count: point.count,
  }))

  const dayCounts = new Array(7).fill(0)
  for (const incident of subset) {
    dayCounts[weekdayIndex(incident.occurredAt)] += 1
  }
  const byDay = WEEKDAYS.map((label, index) => ({ label, count: dayCounts[index] }))

  const hourCounts = new Array(HOUR_BLOCKS.length).fill(0)
  for (const incident of subset) {
    const hour = hourValue(incident.occurredAt)
    const block = HOUR_BLOCKS.findIndex((entry) => hour >= entry.from && hour <= entry.to)
    if (block >= 0) hourCounts[block] += 1
  }
  const byHour = HOUR_BLOCKS.map((entry, index) => ({
    label: entry.label,
    count: hourCounts[index],
  }))

  const statusCounts = new Map<string, number>()
  for (const incident of subset) {
    statusCounts.set(incident.status, (statusCounts.get(incident.status) ?? 0) + 1)
  }

  return {
    category,
    total,
    overallShare: incidents.length > 0 ? round1((total / incidents.length) * 100) : 0,
    current: trend?.current ?? 0,
    previous: trend?.previous ?? 0,
    changePercent: trend?.percent ?? null,
    hasBaseline: trend?.hasBaseline ?? false,
    areas,
    topArea: areas[0] ?? null,
    lowestArea: areas.length > 1 ? areas[areas.length - 1] : null,
    monthly,
    peakMonth: peakBucket(monthly),
    byDay,
    peakDay: peakBucket(byDay),
    byHour,
    peakHour: peakBucket(byHour),
    statuses: toShares(statusCounts, total),
    pending: subset.filter((incident) => incident.status !== 'Closed').length,
    cleared: subset.filter((incident) => incident.status === 'Closed').length,
  }
}
