import type { RiskLevel, TrendDirection } from '../types'

/**
 * Palette for the Risk Zones redesign (light theme).
 * These stay local to the risk UI so the rest of the app keeps its branding.
 */
export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: '#D97706',
  Low: '#16A34A',
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  Critical: 'Critical risk',
  High: 'High risk',
  Medium: 'Medium risk',
  Low: 'Low risk',
}

export const RISK_LEVEL_BADGE: Record<RiskLevel, string> = {
  Critical: 'CRITICAL',
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
}

export const TREND_COLOR: Record<TrendDirection, string> = {
  Rising: '#DC2626',
  Declining: '#16A34A',
  Stable: '#64748B',
}

export const TREND_LABEL: Record<TrendDirection, string> = {
  Rising: 'Rising',
  Declining: 'Declining',
  Stable: 'Stable',
}

/** Page background for the Risk Zones page. */
export const RISK_BG = '#F4F7FB'
/** Card surface. */
export const RISK_CARD_BG = '#FFFFFF'
/** Elevated surface (segmented control rail, chips). */
export const RISK_ELEVATED_BG = '#EAF2FC'
/** Primary action blue. */
export const RISK_ACTION_BLUE = '#2676D2'
/** Quiet border used across the risk UI. */
export const RISK_BORDER = '#D9E2EF'
/** Primary / secondary text. */
export const RISK_TEXT = '#172B4D'
export const RISK_TEXT_MUTED = '#64748B'