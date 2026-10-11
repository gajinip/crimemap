import type { CrimeFilterState, CrimeIncident, DateRange, RiskZone } from '../types'
import { severityOf } from './severity'

export const ALL_AREAS = 'All Areas'

const DAY_MS = 24 * 60 * 60 * 1000

/** Upper bound of the bundled demo dataset. */
export const DATA_MAX_DATE = '2026-10-08'

export function withinDateRange(iso: string, range: DateRange): boolean {
  const time = new Date(iso).getTime()
  const from = new Date(`${range.from}T00:00:00+05:30`).getTime()
  const to = new Date(`${range.to}T23:59:59+05:30`).getTime()
  if (Number.isNaN(from) || Number.isNaN(to)) return true
  return time >= from && time <= to
}

function matchesSearch(incident: CrimeIncident, query: string): boolean {
  if (!query) return true
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return (
    incident.id.toLowerCase().includes(needle) ||
    incident.area.toLowerCase().includes(needle) ||
    incident.category.toLowerCase().includes(needle) ||
    incident.status.toLowerCase().includes(needle) ||
    incident.description.toLowerCase().includes(needle)
  )
}

/**
 * Category, severity, status, area and free-text filters - everything except
 * the date range. The analytics engine needs this because it applies its own
 * recent/previous windows.
 */
export function applyContextFilters(
  incidents: CrimeIncident[],
  filters: CrimeFilterState,
): CrimeIncident[] {
  const categories = new Set(filters.categories)
  const severities = new Set(filters.severities)
  const statuses = new Set(filters.statuses)
  const query = filters.searchQuery.trim()

  return incidents.filter((incident) => {
    if (!categories.has(incident.category)) return false
    if (!severities.has(severityOf(incident.category))) return false
    if (!statuses.has(incident.status)) return false
    if (filters.area !== ALL_AREAS && incident.area !== filters.area) return false
    return matchesSearch(incident, query)
  })
}

/** Applies every active filter, including the date range. */
export function applyCrimeFilters(
  incidents: CrimeIncident[],
  filters: CrimeFilterState,
): CrimeIncident[] {
  return applyContextFilters(incidents, filters).filter((incident) =>
    withinDateRange(incident.occurredAt, filters.dateRange),
  )
}

/**
 * Zones are already derived from the filtered incident set, so only the risk
 * level selector and free-text search are applied here.
 */
export function filterRiskZones(zones: RiskZone[], filters: CrimeFilterState): RiskZone[] {
  const risks = new Set(filters.riskLevels)
  const query = filters.searchQuery.trim().toLowerCase()

  return zones.filter((zone) => {
    if (!risks.has(zone.riskLevel)) return false
    if (filters.area !== ALL_AREAS && zone.area !== filters.area) return false
    if (!query) return true
    return (
      zone.id.toLowerCase().includes(query) ||
      zone.area.toLowerCase().includes(query) ||
      zone.dominantCrime.toLowerCase().includes(query) ||
      zone.riskLevel.toLowerCase().includes(query)
    )
  })
}

/** Counts incidents per category for the current non-category filter context. */
export function countByCategory(
  incidents: CrimeIncident[],
  filters: CrimeFilterState,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const incident of applyContextFilters(incidents, filters)) {
    if (!withinDateRange(incident.occurredAt, filters.dateRange)) continue
    counts[incident.category] = (counts[incident.category] ?? 0) + 1
  }
  return counts
}

/** Quick time-period presets anchored to the end of the demo dataset. */
export function timePresets(): { label: string; days: number | null; range: DateRange }[] {
  const to = new Date(`${DATA_MAX_DATE}T00:00:00+05:30`).getTime()
  const make = (days: number | null): DateRange =>
    days === null
      ? { from: '2026-04-01', to: DATA_MAX_DATE }
      : {
          from: new Date(to - (days - 1) * DAY_MS).toISOString().slice(0, 10),
          to: DATA_MAX_DATE,
        }

  return [
    { label: '1D', days: 1, range: make(1) },
    { label: '7D', days: 7, range: make(7) },
    { label: '30D', days: 30, range: make(30) },
    { label: '90D', days: 90, range: make(90) },
    { label: 'ALL', days: null, range: make(null) },
  ]
}
