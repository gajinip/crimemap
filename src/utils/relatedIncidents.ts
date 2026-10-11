import type { CrimeIncident, GeoPoint } from '../types'

/** Distance ceiling for linking two incidents (metres). */
export const RELATED_MAX_DISTANCE_M = 1500

/** Time ceiling for linking two incidents (hours). */
export const RELATED_MAX_HOURS = 72

const EARTH_RADIUS_M = 6_371_000

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance between two coordinates, in metres. */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

interface RelatedOptions {
  maxDistanceM?: number
  maxHours?: number
}

/**
 * Incidents in `pool` that are "linked" to one of the `seeds`: they share the
 * seed's crime category, sit within `maxDistanceM` metres and took place within
 * `maxHours` hours of it. Seeds themselves are never returned, so the result is
 * always the set of related incidents drawn from other areas.
 */
export function findRelatedIncidents(
  pool: CrimeIncident[],
  seeds: CrimeIncident[],
  options: RelatedOptions = {},
): CrimeIncident[] {
  if (seeds.length === 0) return []

  const maxDistanceM = options.maxDistanceM ?? RELATED_MAX_DISTANCE_M
  const maxDeltaMs = (options.maxHours ?? RELATED_MAX_HOURS) * 60 * 60 * 1000

  const seedIds = new Set(seeds.map((seed) => seed.id))
  const timeOf = (incident: CrimeIncident) => new Date(incident.occurredAt).getTime()

  const seedsByCategory = new Map<string, CrimeIncident[]>()
  for (const seed of seeds) {
    const bucket = seedsByCategory.get(seed.category)
    if (bucket) bucket.push(seed)
    else seedsByCategory.set(seed.category, [seed])
  }

  const related: CrimeIncident[] = []
  for (const candidate of pool) {
    if (seedIds.has(candidate.id)) continue
    const bucket = seedsByCategory.get(candidate.category)
    if (!bucket) continue

    const candidateTime = timeOf(candidate)
    const linked = bucket.some(
      (seed) =>
        Math.abs(candidateTime - timeOf(seed)) <= maxDeltaMs &&
        distanceMeters(seed, candidate) <= maxDistanceM,
    )
    if (linked) related.push(candidate)
  }

  return related
}
