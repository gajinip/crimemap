import type { DisplayPatrolUnit } from '../patrol/patrolStore'
import type { CrimeIncident, GeoPoint, Severity } from '../types'
import { haversineMeters } from './geo'
import { severityOf } from './severity'

/** Default response radius used when alerting nearby officers. */
export const DISPATCH_RADIUS_METERS = 3000

/** A patrol unit resolved as a candidate responder for an incident. */
export interface NearbyOfficer {
  unit: DisplayPatrolUnit
  /** Great-circle distance from the incident to the unit's live position. */
  distanceMeters: number
}

/** Severity of an incident, derived from its category (see `severityOf`). */
export function incidentSeverity(incident: Pick<CrimeIncident, 'category'>): Severity {
  return severityOf(incident.category)
}

/** True when an incident is critical and warrants an immediate dispatch. */
export function isCriticalIncident(incident: Pick<CrimeIncident, 'category'>): boolean {
  return incidentSeverity(incident) === 'Critical'
}

/**
 * Patrol units within `radiusMeters` of a point, nearest first. Officer
 * positions use the live simulation coordinates so the response list tracks
 * each unit as the patrol simulation advances.
 */
export function findNearbyOfficers(
  point: GeoPoint,
  units: DisplayPatrolUnit[],
  radiusMeters = DISPATCH_RADIUS_METERS,
): NearbyOfficer[] {
  return units
    .map((unit) => ({
      unit,
      distanceMeters: haversineMeters(point, { lat: unit.displayLat, lng: unit.displayLng }),
    }))
    .filter((candidate) => candidate.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
}
