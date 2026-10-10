import type { CrimeCategory, RiskLevel } from '../types'

export const CRIME_CATEGORY_COLORS: Record<CrimeCategory, string> = {
  Theft: '#378ADD',
  Robbery: '#E24B4A',
  Assault: '#EF9F27',
  Burglary: '#2E8B57',
  'Vehicle Theft': '#7F56D9',
  Fraud: '#159DAD',
  Other: '#64748B',
}

/** Slate fallback for incident records with an unknown category. */
export const CRIME_FALLBACK_COLOR = '#64748B'

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  Low: '#22c55e',
  Medium: '#eab308',
  High: '#f97316',
  Critical: '#ef4444',
}

export const STATUS_COLORS: Record<string, string> = {
  Reported: '#38bdf8',
  'Under Investigation': '#eab308',
  Closed: '#22c55e',
  Active: '#ef4444',
  Monitoring: '#eab308',
  Contained: '#22c55e',
  Rising: '#ef4444',
  Stable: '#eab308',
  Declining: '#22c55e',
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
