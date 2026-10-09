import type { CrimeCategory, PoliceStation, Recommendation, RiskZone } from '../types'
import { haversineMeters } from '../utils/geo'

/**
 * Turns an explainable risk score into an operational recommendation.
 *
 * Recommendations are rule-based and deterministic: priority and staffing
 * come from the score, the focus window comes from the zone's measured peak
 * hours, and the patrol focus comes from the dominant offence type.
 */

const FOCUS_BY_CRIME: Record<CrimeCategory, string> = {
  Theft: 'plain-clothes coverage of the retail stretch plus CCTV checks',
  Robbery: 'high-visibility two-wheeler patrol near transit stops',
  Assault: 'beat patrol around junctions and late-night gathering spots',
  Burglary: 'night beat across residential lanes and closed shutters',
  'Vehicle Theft': 'marshals on parking clusters and no-parking stretches',
  Fraud: 'verification desk at market beats plus a cyber-cell review',
  Other: 'general preventive patrol and beat verification',
}

function unitsFor(zone: RiskZone): number {
  if (zone.riskLevel === 'Critical') return 3
  if (zone.riskLevel === 'High') return 2
  if (zone.riskLevel === 'Medium') return 1
  return 0
}

function priorityFor(zone: RiskZone): Recommendation['priority'] {
  if (zone.riskScore >= 75) return 'P1'
  if (zone.riskScore >= 55) return 'P2'
  return 'P3'
}

function nearestStation(
  zone: RiskZone,
  stations: PoliceStation[],
): { id: string; name: string; distanceMeters: number } {
  let best = stations[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const station of stations) {
    const distance = haversineMeters(zone, station)
    if (distance < bestDistance) {
      bestDistance = distance
      best = station
    }
  }
  return {
    id: best?.id ?? '—',
    name: best?.name ?? 'Nearest station',
    distanceMeters: Math.round(bestDistance === Number.POSITIVE_INFINITY ? 0 : bestDistance),
  }
}

export function buildRecommendation(
  zone: RiskZone,
  stations: PoliceStation[],
  days = 30,
): Recommendation {
  const units = unitsFor(zone)
  const priority = priorityFor(zone)
  const focus = FOCUS_BY_CRIME[zone.dominantCrime]
  const window = zone.peakWindow === '—' ? '18:00-21:00' : zone.peakWindow
  const nearest = nearestStation(zone, stations)
  const distanceKm = (nearest.distanceMeters / 1000).toFixed(1)

  const headline =
    units > 0
      ? `Deploy ${units} patrol unit${units > 1 ? 's' : ''} to ${zone.area} during ${window}`
      : `Maintain routine beat coverage in ${zone.area}`

  const steps =
    units > 0
      ? [
          `Assign ${units} unit${units > 1 ? 's' : ''} from ${nearest.name} (${distanceKm} km away)`,
          `Peak focus ${window} - ${focus}`,
          `${zone.crimeCount} incidents in the last ${days} days, ${zone.trend.toLowerCase()} ${Math.abs(zone.trendPercent)}%`,
          `${zone.repeatShare}% of incidents repeat within 250 m - cover the repeat locations`,
          `Re-score the zone after ${days} days`,
        ]
      : [
          `No additional units required - zone scored ${zone.riskScore}/100`,
          `Keep the existing beat from ${nearest.name} (${distanceKm} km away)`,
          `Re-score after ${days} days or sooner if volume changes`,
        ]

  const rationale = zone.components
    .filter((component) => component.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 4)
    .map((component) => `${component.label} +${component.points} (${component.detail})`)

  return {
    zoneId: zone.id,
    area: zone.area,
    priority,
    units,
    window,
    focus,
    headline,
    steps,
    rationale,
    nearestStation: nearest,
    isDemo: true,
  }
}

/** Recommendations for the highest-risk zones that need units. */
export function buildDispatchPlan(
  zones: RiskZone[],
  stations: PoliceStation[],
  days = 30,
  limit = 6,
): Recommendation[] {
  const ranked = [...zones].sort((a, b) => b.riskScore - a.riskScore)
  const staffed = ranked.filter((zone) => unitsFor(zone) > 0)
  const plan = (staffed.length >= 3 ? staffed : ranked.slice(0, 3)).slice(0, limit)
  return plan.map((zone) => buildRecommendation(zone, stations, days))
}
