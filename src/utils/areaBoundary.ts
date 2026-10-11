import boundary from '../data/puducherry-boundary.json'
import { DEMO_AREAS, type DemoArea } from '../data/areas'

type Ring = [number, number][]

/**
 * Locality boundaries for the demo dataset.
 *
 * The bundled build has no per-ward polygon data, so each locality's shape is
 * derived from its centre point (the `lat`/`lng` in areas.ts) using a Voronoi
 * tessellation clipped to the Puducherry district outline. The result is a
 * real polygon per area that tiles the district - the same idea a locality
 * border dataset would provide, computed deterministically from the points.
 */

const DISTRICT_RING: Ring = (() => {
  const ring = (boundary.outer as Ring).slice()
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) ring.pop()
  return ring
})()

function squaredDistance(a: DemoArea, b: DemoArea): number {
  const dLat = a.lat - b.lat
  const dLng = a.lng - b.lng
  return dLat * dLat + dLng * dLng
}

/** Keep the part of `poly` closer to `site` than to `other` (a half-plane clip). */
function clipToHalfPlane(poly: Ring, site: DemoArea, other: DemoArea): Ring {
  const dirLng = other.lng - site.lng
  const dirLat = other.lat - site.lat
  const midLng = (site.lng + other.lng) / 2
  const midLat = (site.lat + other.lat) / 2
  const side = (point: Ring[number]) =>
    (point[0] - midLng) * dirLng + (point[1] - midLat) * dirLat

  const out: Ring = []
  for (let i = 0; i < poly.length; i += 1) {
    const current = poly[i]
    const previous = poly[(i - 1 + poly.length) % poly.length]
    const currentSide = side(current)
    const previousSide = side(previous)
    const currentInside = currentSide <= 0
    const previousInside = previousSide <= 0
    const intersection = (): Ring[number] => {
      const t = previousSide / (previousSide - currentSide)
      return [
        previous[0] + (current[0] - previous[0]) * t,
        previous[1] + (current[1] - previous[1]) * t,
      ]
    }

    if (currentInside) {
      if (!previousInside) out.push(intersection())
      out.push(current)
    } else if (previousInside) {
      out.push(intersection())
    }
  }
  return out
}

const cache = new Map<string, Ring | null>()

/**
 * Boundary polygon for a locality as Leaflet `[lat, lng]` positions, or null
 * when the area is unknown or its cell collapses to nothing.
 */
export function areaBoundaryRing(name: string): Ring | null {
  if (cache.has(name)) return cache.get(name) ?? null

  const site = DEMO_AREAS.find((entry) => entry.name === name)
  if (!site) {
    cache.set(name, null)
    return null
  }

  const others = DEMO_AREAS.filter((entry) => entry.name !== name).sort(
    (a, b) => squaredDistance(site, a) - squaredDistance(site, b),
  )

  let poly = DISTRICT_RING
  for (const other of others) {
    poly = clipToHalfPlane(poly, site, other)
    if (poly.length < 3) {
      cache.set(name, null)
      return null
    }
  }

  const ring: Ring = poly.map(([lng, lat]) => [lat, lng])
  cache.set(name, ring)
  return ring
}

/** Leaflet bounds (`[[south, west], [north, east]]`) of a `[lat, lng]` ring. */
export function ringBounds(ring: Ring): [[number, number], [number, number]] {
  let south = Infinity
  let west = Infinity
  let north = -Infinity
  let east = -Infinity
  for (const [lat, lng] of ring) {
    if (lat < south) south = lat
    if (lat > north) north = lat
    if (lng < west) west = lng
    if (lng > east) east = lng
  }
  return [
    [south, west],
    [north, east],
  ]
}
