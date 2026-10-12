import { CRIME_CATEGORIES } from '../types'
import type { CrimeCategory, CrimeIncident, DateRange } from '../types'

/**
 * One row of the grouped category comparison: how many incidents a crime type
 * recorded in each half of the reporting period.
 */
export interface CategoryHalfComparison {
  category: CrimeCategory
  /** Incidents in the first half of the period (acts as the baseline). */
  first: number
  /** Incidents in the second half of the period (the "current" figure). */
  second: number
  /** Percentage change second-vs-first, `null` when there is no baseline. */
  changePercent: number | null
  /** False when the first half had no incidents, so no change can be computed. */
  hasBaseline: boolean
}

/**
 * Splits the reporting period at its mid-point and counts incidents per
 * category in each half, so the grouped comparison chart can show the current
 * half versus the previous one. Mirrors the mid-period split used by the
 * dashboard's CrimeMix panels so numbers reconcile across the app.
 */
export function buildCategoryHalfComparison(
  incidents: CrimeIncident[],
  range: DateRange,
): CategoryHalfComparison[] {
  // Work in epoch milliseconds. Dates are anchored to IST (+05:30) so a "day"
  // matches the local reporting day rather than UTC, and the range is inclusive
  // of its end date (23:59:59).
  const from = new Date(`${range.from}T00:00:00+05:30`).getTime()
  const to = new Date(`${range.to}T23:59:59+05:30`).getTime()
  // Everything strictly before `mid` falls in the first half; the rest is second.
  const mid = from + (to - from) / 2

  const rows = CRIME_CATEGORIES.map((category) => {
    let first = 0
    let second = 0
    // Single pass: ignore other categories and out-of-range dates, then bucket
    // each remaining incident into the first or second half of the window.
    for (const incident of incidents) {
      if (incident.category !== category) continue
      const time = new Date(incident.occurredAt).getTime()
      if (time < from || time > to) continue
      if (time < mid) first += 1
      else second += 1
    }
    return {
      category,
      first,
      second,
      // Round to one decimal. Guard against divide-by-zero when there is no
      // baseline (empty first half) by reporting null instead of Infinity/NaN.
      changePercent: first > 0 ? Math.round(((second - first) / first) * 1000) / 10 : null,
      hasBaseline: first > 0,
    }
  })

  // Sort largest categories first so the tallest bars anchor the chart.
  return rows.sort((a, b) => b.first + b.second - (a.first + a.second))
}

/**
 * Round tick values for a bar-chart Y axis (0..max). Counts are integers, so
 * steps are never below 1, and the top tick always covers the max value.
 */
export function niceTicks(maxValue: number, count = 4): number[] {
  if (maxValue <= 0) return [0]
  // Aim for `count` intervals, then snap the step to a "nice" 1/2/5/10 multiple
  // of the value's magnitude (e.g. max 70 -> step 20) so axis labels read cleanly.
  const rawStep = maxValue / count
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, rawStep)))
  const step = Math.max(1, ([1, 2, 5, 10].find((c) => rawStep <= c * magnitude) ?? 10) * magnitude)

  // Extend the top tick past the max, then walk up from zero in whole steps.
  const capped = Math.ceil(maxValue / step) * step
  const ticks: number[] = []
  for (let value = 0; value <= capped + Number.EPSILON; value += step) {
    ticks.push(Math.round(value * 10) / 10)
  }
  return ticks
}