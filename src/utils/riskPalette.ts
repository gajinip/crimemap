import type { RiskLevel, TrendDirection } from '../types'

/**
 * Reference-style palette for the Risk Zones redesign.
 * These stay local to the risk UI so the rest of the app keeps its branding.
 */
export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  Critical: '#FF304F',
  High: '#FF304F',
  Medium: '#FFAA00',
  Low: '#00D69A',
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
  Rising: '#FF304F',
  Declining: '#00D69A',
  Stable: '#8DB5DE',
}

export const TREND_LABEL: Record<TrendDirection, string> = {
  Rising: 'Rising',
  Declining: 'Declining',
  Stable: 'Stable',
}

/** Page background for the Risk Zones redesign. */
export const RISK_BG = '#031225'
/** Card surface. */
export const RISK_CARD_BG = '#06182D'
/** Elevated surface (segmented control rail, chips). */
export const RISK_ELEVATED_BG = '#0A203B'
/** Primary action blue. */
export const RISK_ACTION_BLUE = '#087BFF'
/** Quiet blue border used across the risk UI. */
export const RISK_BORDER = '#123B67'
/** Primary / secondary text. */
export const RISK_TEXT = '#F4F7FC'
export const RISK_TEXT_MUTED = '#8DB5DE'