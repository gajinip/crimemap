import type { GeoPoint } from '../types'

const EARTH_RADIUS_M = 6371000
const DEG = Math.PI / 180

/** Great-circle distance in metres between two coordinates. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG
  const dLng = (b.lng - a.lng) * DEG
  const lat1 = a.lat * DEG
  const lat2 = b.lat * DEG
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Mean position of a point list, or null when the list is empty. */
export function centroid(points: GeoPoint[]): GeoPoint | null {
  if (points.length === 0) return null
  let lat = 0
  let lng = 0
  for (const point of points) {
    lat += point.lat
    lng += point.lng
  }
  return { lat: lat / points.length, lng: lng / points.length }
}

/** Largest distance from `origin` to any of `points`, in metres. */
export function maxDistanceMeters(origin: GeoPoint, points: GeoPoint[]): number {
  let max = 0
  for (const point of points) {
    const distance = haversineMeters(origin, point)
    if (distance > max) max = distance
  }
  return max
}

/** Linear interpolation between two coordinates. */
export function lerpPoint(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  return {
    lat: a.lat + (b.lat - a.lat) * clamped,
    lng: a.lng + (b.lng - a.lng) * clamped,
  }
}

/* ------------------------------------------------------------------ *
 * Boundary (GeoJSON) helpers
 *
 * The city/enclave boundary is stored as WGS84 (EPSG:4326) GeoJSON with
 * `[longitude, latitude]` positions, per RFC 7946. These helpers parse a
 * Polygon or MultiPolygon, test points against it (respecting holes) and
 * convert it into the `[lat, lng]` rings Leaflet expects.
 * ------------------------------------------------------------------ */

/** A GeoJSON position in `[longitude, latitude]` order. */
export type GeoPosition = [number, number]

/** A closed GeoJSON linear ring. */
export type GeoLinearRing = GeoPosition[]

export interface GeoPolygon {
  type: 'Polygon'
  /** First ring is the exterior, the rest are interior holes. */
  coordinates: GeoLinearRing[]
}

export interface GeoMultiPolygon {
  type: 'MultiPolygon'
  /** One entry per polygon; each is `[exterior, ...holes]`. */
  coordinates: GeoLinearRing[][]
}

/** A boundary that may be either a Polygon or a MultiPolygon. */
export type BoundaryGeometry = GeoPolygon | GeoMultiPolygon

export interface GeoBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface BoundaryProperties {
  name?: string
  boundaryType?: string
  source?: string
  sourceUrl?: string
  licence?: string
  retrieved?: string
  [key: string]: unknown
}

export interface BoundaryFeature {
  type: 'Feature'
  properties: BoundaryProperties
  geometry: BoundaryGeometry
}

export interface BoundaryFeatureCollection {
  type: 'FeatureCollection'
  features: BoundaryFeature[]
}

/** Every ring of a Polygon or MultiPolygon, flattened (exteriors and holes). */
export function geometryRings(geometry: BoundaryGeometry): GeoLinearRing[] {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
}

/** Signed planar area of a `[lng, lat]` ring (positive = counter-clockwise). */
export function ringSignedArea(ring: GeoLinearRing): number {
  let area = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return area / 2
}

/** Ray-casting test for a single closed ring in `[lng, lat]` order. */
export function pointInRing(point: GeoPoint, ring: GeoLinearRing): boolean {
  const x = point.lng
  const y = point.lat
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

/**
 * Even-odd point-in-geometry test that honours Polygon and MultiPolygon
 * exteriors and holes: a point inside a hole toggles an even number of
 * times and is therefore considered outside.
 */
export function pointInBoundary(point: GeoPoint, geometry: BoundaryGeometry): boolean {
  let inside = false
  for (const ring of geometryRings(geometry)) {
    if (pointInRing(point, ring)) inside = !inside
  }
  return inside
}

/** South/west/north/east extent of a Polygon or MultiPolygon. */
export function geometryBounds(geometry: BoundaryGeometry): GeoBounds {
  let south = Infinity
  let west = Infinity
  let north = -Infinity
  let east = -Infinity
  for (const ring of geometryRings(geometry)) {
    for (const [lng, lat] of ring) {
      if (lng < west) west = lng
      if (lng > east) east = lng
      if (lat < south) south = lat
      if (lat > north) north = lat
    }
  }
  return { south, west, north, east }
}

/** True when the geometry has enough vertices to form a usable area. */
export function isValidBoundaryGeometry(geometry: BoundaryGeometry): boolean {
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') return false
  const rings = geometryRings(geometry)
  if (rings.length === 0) return false
  return rings.every(
    (ring) =>
      ring.length >= 4 &&
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1],
  )
}

/** GeoJSON `[lng, lat]` ring -> Leaflet `[lat, lng]` ring. */
export function ringToLatLng(ring: GeoLinearRing): [number, number][] {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number])
}
