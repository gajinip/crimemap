import type { RiskLevel, TrendDirection } from '../types'

/**
 * Palette for the Risk Zones redesign (light theme).
 * These stay local to the risk UI so the rest of the app keeps its branding.
 */
export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  Critical: '#EA4335',
  High: '#FA7B17',
  Medium: '#F9AB00',
  Low: '#34A853',
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
  Rising: '#EA4335',
  Declining: '#34A853',
  Stable: '#5F6368',
}

export const TREND_LABEL: Record<TrendDirection, string> = {
  Rising: 'Rising',
  Declining: 'Declining',
  Stable: 'Stable',
}

/** Page background for the Risk Zones page. */
export const RISK_BG = '#FFFFFF'
/** Card surface. */
export const RISK_CARD_BG = '#FFFFFF'
/** Elevated surface (segmented control rail, chips). */
export const RISK_ELEVATED_BG = '#F4F7FB'
/** Primary action blue. */
export const RISK_ACTION_BLUE = '#1A73E8'
/** Quiet border used across the risk UI. */
export const RISK_BORDER = '#DCE4EE'
/** Primary / secondary text. */
export const RISK_TEXT = '#14233B'
export const RISK_TEXT_MUTED = '#53647A'