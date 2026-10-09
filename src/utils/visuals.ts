import type { CrimeCategory, RiskLevel } from '../types'

export const CRIME_CATEGORY_COLORS: Record<CrimeCategory, string> = {
  Theft: '#38bdf8',
  Robbery: '#f43f5e',
  Assault: '#fb923c',
  Burglary: '#a78bfa',
  'Vehicle Theft': '#facc15',
  Fraud: '#2dd4bf',
  Other: '#94a3b8',
}

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
