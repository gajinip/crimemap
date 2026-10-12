import type { CrimeCategory, RiskLevel } from '../types'

export const CRIME_CATEGORY_COLORS: Record<CrimeCategory, string> = {
  Theft: '#2676D2',
  Robbery: '#16A085',
  Assault: '#2676D2',
  Burglary: '#8B5CF6',
  'Vehicle Theft': '#0EA5E9',
  Fraud: '#14B8A6',
  Other: '#64748B',
}

/** Grey fallback for incident records with an unknown category. */
export const CRIME_FALLBACK_COLOR = '#64748B'

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  Low: '#16A34A',
  Medium: '#D97706',
  High: '#EA580C',
  Critical: '#DC2626',
}

export const STATUS_COLORS: Record<string, string> = {
  Reported: '#2676D2',
  'Under Investigation': '#D97706',
  Closed: '#16A34A',
  Active: '#DC2626',
  Monitoring: '#D97706',
  Contained: '#16A34A',
  Rising: '#DC2626',
  Stable: '#64748B',
  Declining: '#16A34A',
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
