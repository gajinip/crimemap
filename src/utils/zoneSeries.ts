import type { CrimeIncident } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

function istDayStart(iso: string): number {
  const time = new Date(`${iso.slice(0, 10)}T00:00:00+05:30`).getTime()
  return Number.isNaN(time) ? 0 : time
}

/**
 * Daily incident counts for a locality over the last `points` calendar days.
 * Always derived from the real (demo) incident records - never fabricated.
 * Returns [] when the locality has no incidents on record.
 */
export function zoneDailySeries(
  incidents: CrimeIncident[],
  area: string,
  points = 28,
): number[] {
  const days: number[] = []
  for (const incident of incidents) {
    if (incident.area !== area) continue
    const day = istDayStart(incident.occurredAt)
    if (day) days.push(day)
  }
  if (days.length === 0) return []

  const maxDay = Math.max(...days)
  const minDay = maxDay - (points - 1) * DAY_MS
  const counts = new Array<number>(points).fill(0)
  for (const day of days) {
    const index = Math.round((day - minDay) / DAY_MS)
    if (index >= 0 && index < points) counts[index] += 1
  }

  // Trim trailing all-zero days so the sparkline stays honest about coverage.
  let last = counts.length - 1
  while (last >= 0 && counts[last] === 0) last -= 1
  return last >= 0 ? counts.slice(0, last + 1) : []
}