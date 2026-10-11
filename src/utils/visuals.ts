import type { CrimeCategory, RiskLevel } from '../types'

export const CRIME_CATEGORY_COLORS: Record<CrimeCategory, string> = {
  Theft: '#1A73E8',
  Robbery: '#EA4335',
  Assault: '#FA7B17',
  Burglary: '#34A853',
  'Vehicle Theft': '#A142F4',
  Fraud: '#12B5CB',
  Other: '#5F6368',
}

/** Grey fallback for incident records with an unknown category. */
export const CRIME_FALLBACK_COLOR = '#5F6368'

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  Low: '#34A853',
  Medium: '#F9AB00',
  High: '#FA7B17',
  Critical: '#EA4335',
}

export const STATUS_COLORS: Record<string, string> = {
  Reported: '#1A73E8',
  'Under Investigation': '#F9AB00',
  Closed: '#34A853',
  Active: '#EA4335',
  Monitoring: '#F9AB00',
  Contained: '#34A853',
  Rising: '#EA4335',
  Stable: '#F9AB00',
  Declining: '#34A853',
}

export function riskLevelClass(level: RiskLevel): string {
  switch (level) {
    case 'Low':
      return 'border-risk-low/40 bg-risk-low/10 text-risk-low'
    case 'Medium':
      return 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium'
    case 'High':
      return 'border-risk-high/40 bg-risk-high/10 text-risk-high'
    case 'Critical':
      return 'border-risk-critical/40 bg-risk-critical/10 text-risk-critical'
  }
}

export function trendGlyph(trend: 'Rising' | 'Stable' | 'Declining'): string {
  if (trend === 'Rising') return '▲'
  if (trend === 'Declining') return '▼'
  return '■'
}
