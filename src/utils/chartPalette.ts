import type { CrimeCategory } from '../types'

/**
 * Cool chart series used for all chart segments. The primary series is the
 * professional brand blue and the secondary series the teal accent, with the
 * remaining categories kept distinct (and clear of the red/orange/amber/green
 * severity ramp); the map and incident dots keep `CRIME_CATEGORY_COLORS` for
 * their spatial semantics.
 */
export const CRIME_CATEGORY_SERIES: Record<CrimeCategory, string> = {
  Theft: '#2676D2',
  Robbery: '#16A085',
  Assault: '#3B82F6',
  Burglary: '#8B5CF6',
  'Vehicle Theft': '#0EA5E9',
  Fraud: '#14B8A6',
  Other: '#64748B',
}

/** Bar / area fill stops (brand blue -> teal) for single-series charts. */
export const CHART_PRIMARY = '#2676D2'
export const CHART_VIOLET = '#16A085'
export const CHART_GRID = '#D9E2EF'