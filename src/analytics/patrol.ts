import type { GeoPoint, PatrolPlan, PatrolUnit, PoliceStation, Recommendation, RiskZone } from '../types'
import { haversineMeters, lerpPoint } from '../utils/geo'

/**
 * Patrol unit simulation.
 *
 * Builds a deterministic dispatch plan from the risk zones and recommendations,
 * then projects a unit's position along its route. The simulation is purely a
 * visual aid for the demo: it does not model real vehicles, real response times
 * or real officers.
 */

const CALLSIGNS = ['Echo', 'Falcon', 'Guardian', 'Hunter', 'Jaguar', 'Kestrel']
const UNIT_COUNT = 6
const SPEED_KMPH = 24
const ORBIT_RADIUS_FACTOR = 1.6
const MIN_ROUTE_SECONDS = 10 * 60

function zoneById(zones: RiskZone[], zoneId: string): RiskZone | undefined {
  return zones.find((zone) => zone.id === zoneId)
}

function routeFor(zone: RiskZone, station: PoliceStation, index: number): GeoPoint[] {
  const orbitRadius = zone.radiusMeters * ORBIT_RADIUS_FACTOR
  const offsetDegrees = orbitRadius / 111320
  const baseAngle = (index * 37 * Math.PI) / 180
  const orbit: GeoPoint[] = [0, 1, 2, 3].map((step) => {
    const angle = baseAngle + (step * Math.PI) / 2
    return {
      lat: zone.lat + Math.sin(angle) * offsetDegrees,
      lng: zone.lng + Math.cos(angle) * offsetDegrees * 1.1,
    }
  })
  return [{ lat: station.lat, lng: station.lng }, { lat: zone.lat, lng: zone.lng }, ...orbit]
}

function routeLengthMeters(route: GeoPoint[]): number {
  let total = 0
  for (let index = 1; index < route.length; index += 1) {
    total += haversineMeters(route[index - 1], route[index])
  }
  return total
}

/** Point at position `t` (0-1) along a polyline route. */
export function pointAlongRoute(route: GeoPoint[], t: number): GeoPoint {
  if (route.length === 0) return { lat: 0, lng: 0 }
  if (route.length === 1) return route[0]

  const progress = t < 0 ? 0 : t > 1 ? 1 : t
  const total = routeLengthMeters(route)
  if (total === 0) return route[0]

  const target = total * progress
  let travelled = 0
  for (let index = 1; index < route.length; index += 1) {
    const segment = haversineMeters(route[index - 1], route[index])
    if (travelled + segment >= target) {
      const local = segment === 0 ? 0 : (target - travelled) / segment
      return lerpPoint(route[index - 1], route[index], local)
    }
    travelled += segment
  }
  return route[route.length - 1]
}

/** Seconds a unit needs to complete one full route at the demo speed. */
export function routeDurationSeconds(route: GeoPoint[]): number {
  const km = routeLengthMeters(route) / 1000
  return Math.max(MIN_ROUTE_SECONDS, (km / SPEED_KMPH) * 3600)
}

/** Projects a unit's display state for a given route progress. */
export function projectUnit(
  unit: Pick<PatrolUnit, 'route' | 'progress'>,
): { lat: number; lng: number; status: PatrolUnit['status']; etaMinutes: number } {
  if (unit.route.length <= 1) {
    const point = unit.route[0] ?? { lat: 0, lng: 0 }
    return { lat: point.lat, lng: point.lng, status: 'Standby', etaMinutes: 0 }
  }

  const point = pointAlongRoute(unit.route, unit.progress)
  const total = routeLengthMeters(unit.route)
  const firstLeg = haversineMeters(unit.route[0], unit.route[1])
  const deploying = unit.progress * total < firstLeg
  const remainingSeconds = deploying
    ? routeDurationSeconds(unit.route) * (1 - unit.progress)
    : 0

  return {
    lat: point.lat,
    lng: point.lng,
    status: deploying ? 'Deploying' : 'Patrolling',
    etaMinutes: deploying ? Math.max(1, Math.round(remainingSeconds / 60)) : 0,
  }
}

function makeUnit(
  index: number,
  station: PoliceStation,
  zone: RiskZone | undefined,
): PatrolUnit {
  const route: GeoPoint[] = zone
    ? routeFor(zone, station, index)
    : [{ lat: station.lat, lng: station.lng }]

  return {
    id: `PU-${String(index + 1).padStart(2, '0')}`,
    callsign: `${CALLSIGNS[index % CALLSIGNS.length]}-${Math.floor(index / CALLSIGNS.length) + 1}`,
    status: zone ? 'Deploying' : 'Standby',
    progress: 0,
    etaMinutes: 0,
    stationId: station.id,
    stationName: station.name,
    zoneId: zone?.id ?? '',
    zoneArea: zone?.area ?? 'Base',
    route,
    lat: station.lat,
    lng: station.lng,
  }
}

/** Turns per-zone unit counts into simulated patrol units, padded with standby. */
function assembleUnits(
  zones: RiskZone[],
  stations: PoliceStation[],
  recommendations: Recommendation[],
  assigned: Map<string, number>,
): PatrolUnit[] {
  const units: PatrolUnit[] = []
  for (const recommendation of recommendations) {
    const count = assigned.get(recommendation.zoneId) ?? 0
    if (count === 0) continue
    const zone = zoneById(zones, recommendation.zoneId)
    if (!zone) continue
    const station =
      stations.find((entry) => entry.id === recommendation.nearestStation.id) ?? stations[0]
    if (!station) continue
    for (let index = 0; index < count; index += 1) {
      units.push(makeUnit(units.length, station, zone))
    }
  }

  let fallback = 0
  while (units.length < UNIT_COUNT && fallback < stations.length) {
    units.push(makeUnit(units.length, stations[fallback], undefined))
    fallback += 1
  }
  return units
}

/**
 * Builds a simulated dispatch plan: the unit pool is dealt round-robin across
 * the staffed recommendations (one unit per zone first, then a second unit per
 * zone), so the simulation covers as many high-risk zones as possible. Left-over
 * units stay at base.
 */
export function buildPatrolPlan(
  zones: RiskZone[],
  stations: PoliceStation[],
  recommendations: Recommendation[],
  generatedAt: string,
): PatrolPlan {
  const staffed = recommendations.filter((recommendation) => recommendation.units > 0)

  const assigned = new Map<string, number>()
  let remaining = UNIT_COUNT
  let progressed = true
  while (remaining > 0 && progressed) {
    progressed = false
    for (const recommendation of staffed) {
      if (remaining <= 0) break
      const current = assigned.get(recommendation.zoneId) ?? 0
      if (current >= recommendation.units) continue
      assigned.set(recommendation.zoneId, current + 1)
      remaining -= 1
      progressed = true
    }
  }

  const units = assembleUnits(zones, stations, staffed, assigned)
  const covered = new Set(units.map((unit) => unit.zoneId).filter((id) => id !== ''))

  return {
    units,
    coveredZones: covered.size,
    generatedAt,
    isDemo: true,
  }
}

const PRIORITY_RANK: Record<Recommendation['priority'], number> = { P1: 0, P2: 1, P3: 2 }

/**
 * Priority-weighted dispatch plan.
 *
 * Instead of dealing one unit to every zone before any zone gets a second, the
 * unit pool is filled greedily from the top of the ranked list: the highest
 * priority (then highest risk score) zone is staffed to its recommended strength
 * before the next zone is considered, concentrating units where the effective
 * risk is highest. Left-over units stay at base.
 */
export function buildPatrolPlanWeighted(
  zones: RiskZone[],
  stations: PoliceStation[],
  recommendations: Recommendation[],
  generatedAt: string,
): PatrolPlan {
  const staffed = recommendations
    .filter((recommendation) => recommendation.units > 0)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])

  const assigned = new Map<string, number>()
  let remaining = UNIT_COUNT
  for (const recommendation of staffed) {
    if (remaining <= 0) break
    const take = Math.min(recommendation.units, remaining)
    assigned.set(recommendation.zoneId, take)
    remaining -= take
  }

  const units = assembleUnits(zones, stations, staffed, assigned)
  const covered = new Set(units.map((unit) => unit.zoneId).filter((id) => id !== ''))

  return {
    units,
    coveredZones: covered.size,
    generatedAt,
    isDemo: true,
  }
}
