import type { CrimeCategory, Recommendation, RiskLevel, RiskZone } from '../types'

/**
 * A critical-incident alert surfaced in the notification drawer.
 *
 * Alerts are derived from the deterministic risk-zone engine over the bundled
 * synthetic dataset. They are an in-app situational-awareness aid only: no
 * message is transmitted to any police unit or external system.
 */
export interface CriticalAlert {
  /** Stable id (mirrors the source zone id). */
  id: string
  /** Human-readable incident reference shown in the drawer. */
  reference: string
  area: string
  category: CrimeCategory
  riskLevel: RiskLevel
  riskScore: number
  /** When the alert was raised (ISO timestamp). */
  raisedAt: string
  /** Nearest responding station, when one can be resolved. */
  stationName: string | null
  /** Distance to that station in metres, when available. */
  distanceMeters: number | null
  /** Peak activity window for the source zone, e.g. "20:00-23:00". */
  window: string | null
}

/**
 * Build the alert feed from the current risk zones, prioritising the most
 * severe zones and attaching the nearest responding station where known.
 * Deterministic and side-effect free so it can be unit-tested.
 */
export function buildCriticalAlerts(
  zones: RiskZone[],
  recommendations: Recommendation[],
  raisedAt: string,
  limit = 6,
): CriticalAlert[] {
  return zones
    .filter((zone) => zone.riskLevel === 'Critical' || zone.riskLevel === 'High')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit)
    .map((zone) => {
      const recommendation = recommendations.find(
        (entry) => entry.zoneId === zone.id || entry.area === zone.area,
      )
      return {
        id: zone.id,
        reference: `CM-${zone.id}`,
        area: zone.area,
        category: zone.dominantCrime,
        riskLevel: zone.riskLevel,
        riskScore: Math.round(zone.riskScore),
        raisedAt,
        stationName: recommendation?.nearestStation.name ?? null,
        distanceMeters: recommendation?.nearestStation.distanceMeters ?? null,
        window: zone.peakWindow || null,
      }
    })
}
