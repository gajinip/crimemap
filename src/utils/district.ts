import boundary from '../data/puducherry-boundary.json'

/**
 * Return true if the supplied coordinate falls inside the Puducherry district
 * exterior boundary (puducherry-boundary.json). The JSON ring stores
 * [longitude, latitude] pairs; this uses the standard ray-casting test.
 *
 * Lives outside the CrimeMap component file so both the map and the MapView
 * "locate me" control can share it without tripping fast-refresh rules.
 */
export function isInsidePuducherry(lat: number, lng: number): boolean {
  const ring = boundary.outer
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]

    const crosses =
      (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (crosses) {
      inside = !inside
    }
  }

  return inside
}
