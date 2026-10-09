import type {
  AnalysisWindow,
  ChangeReport,
  ChangeSignal,
  CrimeCategory,
  CrimeIncident,
  DateRange,
} from '../types'
import { buildAnalysisWindow, hourOf } from './risk'

/**
 * "What changed?" detection.
 *
 * Compares the recent window against the previous equal-length window for
 * every locality and emits only statistically meaningful differences:
 *
 *   rising     incidents up >= 25% with enough volume to matter
 *   emerging   no incidents previously, new cluster now
 *   declining  incidents down >= 15%
 *
 * Text is generated from the data - nothing here is hard-coded per locality.
 */

const RISING_THRESHOLD = 25
const DECLINING_THRESHOLD = -15
const MIN_RISING_COUNT = 3
const MIN_EMERGING_COUNT = 3
const MIN_DECLINING_PREVIOUS = 3
const MAX_SIGNALS = 12

interface AreaDelta {
  area: string
  recent: CrimeIncident[]
  previous: CrimeIncident[]
  deltaPercent: number
}

function dominantRisingCategory(
  recent: CrimeIncident[],
  previous: CrimeIncident[],
): { category: CrimeCategory; beforeCount: number; recentCount: number } | null {
  const recentCounts = new Map<CrimeCategory, number>()
  const previousCounts = new Map<CrimeCategory, number>()
  for (const incident of recent) {
    recentCounts.set(incident.category, (recentCounts.get(incident.category) ?? 0) + 1)
  }
  for (const incident of previous) {
    previousCounts.set(incident.category, (previousCounts.get(incident.category) ?? 0) + 1)
  }

  let best: { category: CrimeCategory; beforeCount: number; recentCount: number } | null = null
  let bestIncrease = -1
  for (const [category, count] of recentCounts) {
    const before = previousCounts.get(category) ?? 0
    const delta = before === 0 ? Number.POSITIVE_INFINITY : ((count - before) / before) * 100
    if (delta < RISING_THRESHOLD || count < 2) continue
    const increase = count - before
    if (increase > bestIncrease) {
      bestIncrease = increase
      best = { category, beforeCount: before, recentCount: count }
    }
  }
  return best
}

function computeAreaDeltas(incidents: CrimeIncident[], window: AnalysisWindow): AreaDelta[] {
  const byArea = new Map<string, { recent: CrimeIncident[]; previous: CrimeIncident[] }>()

  for (const incident of incidents) {
    const time = new Date(incident.occurredAt).getTime()
    if (Number.isNaN(time) || time < window.previousFrom || time > window.recentTo) continue
    let entry = byArea.get(incident.area)
    if (!entry) {
      entry = { recent: [], previous: [] }
      byArea.set(incident.area, entry)
    }
    if (time >= window.recentFrom) entry.recent.push(incident)
    else entry.previous.push(incident)
  }

  const deltas: AreaDelta[] = []
  for (const [area, entry] of byArea) {
    const deltaPercent =
      entry.previous.length === 0
        ? entry.recent.length > 0
          ? 100
          : 0
        : ((entry.recent.length - entry.previous.length) / entry.previous.length) * 100
    deltas.push({ area, recent: entry.recent, previous: entry.previous, deltaPercent })
  }
  return deltas
}

function peakHourShare(incidents: CrimeIncident[]): number {
  if (incidents.length === 0) return 0
  const hours = new Array<number>(24).fill(0)
  for (const incident of incidents) hours[hourOf(incident)] += 1
  return Math.max(...hours) / incidents.length
}

function buildSignal(delta: AreaDelta, window: AnalysisWindow): ChangeSignal | null {
  const { area, recent, previous, deltaPercent } = delta
  const rounded = Math.round(deltaPercent)

  if (previous.length === 0 && recent.length >= MIN_EMERGING_COUNT) {
    const rising = dominantRisingCategory(recent, previous)
    return {
      id: `CHG-${area}-emerging`,
      kind: 'emerging',
      severity: 'medium',
      area,
      headline: 'New emerging hotspot detected',
      detail: `${recent.length} incidents in ${window.days} days after none in the previous ${window.days} days${rising ? ` · ${rising.category} leads` : ''}`,
      deltaPercent: 100,
      recentCount: recent.length,
      previousCount: 0,
      category: rising?.category ?? null,
    }
  }

  if (rounded >= RISING_THRESHOLD && recent.length >= MIN_RISING_COUNT) {
    const rising = dominantRisingCategory(recent, previous)
    const headline = rising
      ? `${rising.category}: ${rising.beforeCount} → ${rising.recentCount} incidents`
      : `Incident volume: ${previous.length} → ${recent.length} incidents`
    const peakShare = Math.round(peakHourShare(recent) * 100)
    return {
      id: `CHG-${area}-rising`,
      kind: 'rising',
      severity: 'high',
      area,
      headline,
      detail: `Locality total up ${rounded}% · ${peakShare}% of recent incidents fall in the busiest hour`,
      deltaPercent: rounded,
      recentCount: recent.length,
      previousCount: previous.length,
      category: rising?.category ?? null,
    }
  }

  if (rounded <= DECLINING_THRESHOLD && previous.length >= MIN_DECLINING_PREVIOUS) {
    return {
      id: `CHG-${area}-declining`,
      kind: 'declining',
      severity: 'low',
      area,
      headline: `Incidents decreased ${Math.abs(rounded)}%`,
      detail: `${previous.length} → ${recent.length} incidents over the last ${window.days} days`,
      deltaPercent: rounded,
      recentCount: recent.length,
      previousCount: previous.length,
      category: null,
    }
  }

  return null
}

const SEVERITY_ORDER: Record<ChangeSignal['severity'], number> = { high: 0, medium: 1, low: 2 }

/** Detects significant locality-level changes between the two windows. */
export function detectChanges(
  incidents: CrimeIncident[],
  range: DateRange,
): ChangeReport {
  const window = buildAnalysisWindow(range)
  const deltas = computeAreaDeltas(incidents, window)

  const signals = deltas
    .map((delta) => buildSignal(delta, window))
    .filter((signal): signal is ChangeSignal => signal !== null)
    .sort((a, b) => {
      const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
      if (bySeverity !== 0) return bySeverity
      if (a.kind === 'rising' && b.kind === 'rising') return b.deltaPercent - a.deltaPercent
      if (a.kind === 'emerging' && b.kind === 'emerging') return b.recentCount - a.recentCount
      return a.deltaPercent - b.deltaPercent
    })
    .slice(0, MAX_SIGNALS)

  const recentTotal = deltas.reduce((sum, delta) => sum + delta.recent.length, 0)
  const previousTotal = deltas.reduce((sum, delta) => sum + delta.previous.length, 0)
  const overallDeltaPercent =
    previousTotal === 0
      ? recentTotal > 0
        ? 100
        : 0
      : Math.round(((recentTotal - previousTotal) / previousTotal) * 100)

  return {
    window,
    signals,
    recentTotal,
    previousTotal,
    overallDeltaPercent,
    isDemo: true,
  }
}
