import type { CrimeCategory, Severity } from '../types'

/**
 * Deterministic severity for each crime category. Used for the severity map
 * filter and as one weighted input of the risk score.
 */
export const CATEGORY_SEVERITY: Record<CrimeCategory, Severity> = {
  Robbery: 'Critical',
  Assault: 'High',
  Burglary: 'High',
  'Vehicle Theft': 'High',
  Theft: 'Medium',
  Fraud: 'Medium',
  Other: 'Low',
}

/** Numeric weight used by the analytics engine (0-1). */
export const SEVERITY_WEIGHT: Record<Severity, number> = {
  Low: 0.4,
  Medium: 0.6,
  High: 0.8,
  Critical: 1,
}

export function severityOf(category: CrimeCategory): Severity {
  return CATEGORY_SEVERITY[category]
}
