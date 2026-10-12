
import { useEffect, useRef } from 'react'
import {
  Circle,
  CircleMarker,
  LayerGroup,
  LayersControl,
  MapContainer,
  Pane,
  Polygon,
  ScaleControl,
  TileLayer,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { useI18n } from '../../i18n/useI18n'
import { DEMO_AREAS, PUDUCHERRY_CENTER } from '../../data/areas'
import boundary from '../../data/puducherry-boundary.json'
import type { DisplayPatrolUnit } from '../../patrol/patrolStore'
import type {
  CrimeIncident,
  GeoPoint,
  PoliceStation,
  RiskZone,
} from '../../types'
import { ALL_AREAS } from '../../utils/filters'
import { areaBoundaryRing, ringBounds } from '../../utils/areaBoundary'
import { isInsidePuducherry } from '../../utils/district'
import { IncidentLayer } from './ClusterLayer'
import { PatrolLayer } from './PatrolLayer'
import { PoliceStationMarker } from './PoliceStationMarker'
import { RiskZoneLayer } from './RiskZoneLayer'

/**
 * Puducherry district bounding rectangle.
 * Coordinates use [latitude, longitude] order for Leaflet.
 */
const PUDUCHERRY_BOUNDS: [[number, number], [number, number]] = [
  [boundary.bbox.south, boundary.bbox.west],
  [boundary.bbox.north, boundary.bbox.east],
]

/**
 * District outline converted from [longitude, latitude]
 * in the JSON asset to [latitude, longitude] for Leaflet.
 */
const BOUNDARY_POSITIONS: [number, number][] =
  boundary.outer.map(([lng, lat]) => [lat, lng])

/**
 * Outer ring for the outside-area mask.
 *
 * Only needs to cover the largest viewport the `maxBounds` clamp allows, so it
 * is sized to the district bbox plus a small margin. A world-spanning ring
 * projects to huge SVG coordinates and makes the mask redraw and zoom slowly.
 */
const MASK_MARGIN = 5

const MASK_RING: [number, number][] = [
  [boundary.bbox.south - MASK_MARGIN, boundary.bbox.west - MASK_MARGIN],
  [boundary.bbox.south - MASK_MARGIN, boundary.bbox.east + MASK_MARGIN],
  [boundary.bbox.north + MASK_MARGIN, boundary.bbox.east + MASK_MARGIN],
  [boundary.bbox.north + MASK_MARGIN, boundary.bbox.west - MASK_MARGIN],
]

/**
 * Spotlight radius around a selected locality.
 * Measured in approximate geographic degrees.
 */
const AREA_SPOTLIGHT_RADIUS = 0.008

/**
 * Build a circular ring around a coordinate.
 * Longitude is adjusted for latitude to make the circle
 * look more consistent on the map.
 */
function buildSpotlightRing(
  lat: number,
  lng: number,
  radius: number,
  steps = 72,
): [number, number][] {
  const lngScale = 1 / Math.cos((lat * Math.PI) / 180)
  const ring: [number, number][] = []

  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2

    ring.push([
      lat + radius * Math.sin(angle),
      lng + radius * lngScale * Math.cos(angle),
    ])
  }

  return ring
}

/**
 * Build the inner hole of the outside mask.
 *
 * All Areas: reveal the complete district.
 * One locality: reveal the locality's boundary polygon when available,
 * otherwise a spotlight around that locality.
 */
function maskHole(
  selectedArea: string,
  boundary: [number, number][] | null,
): [number, number][] {
  if (boundary) {
    return boundary
  }

  if (selectedArea !== ALL_AREAS) {
    const area = DEMO_AREAS.find(
      (entry) => entry.name === selectedArea,
    )

    if (
      area &&
      isInsidePuducherry(area.lat, area.lng)
    ) {
      return buildSpotlightRing(
        area.lat,
        area.lng,
        AREA_SPOTLIGHT_RADIUS,
      )
    }
  }

  return BOUNDARY_POSITIONS
}

interface CrimeMapProps {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  stations: PoliceStation[]
  selectedArea: string
  searchQuery: string
  relatedIncidentIds?: Set<string>
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
  onSelectIncident: (incident: CrimeIncident) => void
  onSelectStation: (station: PoliceStation) => void
  onSelectPatrol: (unit: DisplayPatrolUnit) => void
  onDeselect: () => void
  pickingLocation: boolean
  onPickLocation: (point: GeoPoint) => void
  /** Last known browser location, highlighted with a pulsing marker. */
  userLocation: GeoPoint | null
  /** Accuracy radius (metres) for the user marker, when known. */
  userAccuracyMeters?: number | null
}

/**
 * Move the camera when the selected area changes.
 */
function AreaCameraController({
  selectedArea,
  boundary,
}: {
  selectedArea: string
  boundary: [number, number][] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (boundary) {
      map.flyToBounds(ringBounds(boundary), {
        duration: 0.5,
        maxZoom: 14,
        padding: [28, 28],
      })
      return
    }

    if (selectedArea === ALL_AREAS) {
      map.flyToBounds(PUDUCHERRY_BOUNDS, {
        duration: 0.35,
        maxZoom: 14,
        padding: [20, 20],
      })
      return
    }

    const area = DEMO_AREAS.find(
      (entry) => entry.name === selectedArea,
    )

    if (area && isInsidePuducherry(area.lat, area.lng)) {
      map.flyTo(
        [area.lat, area.lng],
        Math.max(map.getZoom(), 13),
        { duration: 0.35 },
      )
    }
  }, [map, selectedArea, boundary])

  return null
}

/**
 * Focus the camera on an in-bound incident when the
 * search query changes.
 *
 * This uses the first in-bound incident in the supplied
 * array; it does not perform text matching itself.
 */
function SearchFocusController({
  query,
  incidents,
}: {
  query: string
  incidents: CrimeIncident[]
}) {
  const map = useMap()
  const lastQuery = useRef('')

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      lastQuery.current = ''
      return
    }

    if (trimmed === lastQuery.current) {
      return
    }

    lastQuery.current = trimmed

    const match = incidents.find((incident) =>
      isInsidePuducherry(incident.lat, incident.lng),
    )

    if (!match) {
      return
    }

    map.flyTo(
      [match.lat, match.lng],
      Math.max(map.getZoom(), 16),
      { duration: 0.6 },
    )
  }, [query, incidents, map])

  return null
}

/**
 * Close any open detail sheet when the empty map is tapped.
 * Marker clicks stop propagation, so they never reach this handler.
 */
function TapToDismiss({ onDeselect }: { onDeselect: () => void }) {
  const map = useMap()

  useEffect(() => {
    map.on('click', onDeselect)
    return () => {
      map.off('click', onDeselect)
    }
  }, [map, onDeselect])

  return null
}

/**
 * Keep Leaflet's internal size in sync when the map container resizes
 * (responsive layout changes, side rail toggling, orientation change).
 */
function AutoResize() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [map])

  return null
}

/**
 * Capture a map click as a new incident location when
 * location-picking mode is enabled.
 */
function LocationPicker({
  active,
  onPick,
}: {
  active: boolean
  onPick: (point: GeoPoint) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!active) {
      return
    }

    const handleClick = (event: LeafletMouseEvent) => {
      const { lat, lng } = event.latlng

      // Do not allow new incident locations outside the district.
      if (!isInsidePuducherry(lat, lng)) {
        return
      }

      onPick({ lat, lng })
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [active, map, onPick])

  return null
}

/**
 * Pulsing marker showing where the operator currently is. Rendered in its own
 * pane above the data layers so it is never hidden behind incidents. The soft
 * ring is the browser-reported accuracy radius, drawn in metres.
 */
function UserLocationMarker({
  location,
  accuracyMeters,
}: {
  location: GeoPoint
  accuracyMeters?: number | null
}) {
  return (
    <Pane
      name="user-location"
      style={{ zIndex: 640 }}
    >
      {accuracyMeters && accuracyMeters > 0 ? (
        <Circle
          center={[location.lat, location.lng]}
          radius={accuracyMeters}
          pathOptions={{
            stroke: false,
            fill: true,
            fillColor: '#2676D2',
            fillOpacity: 0.12,
            interactive: false,
          }}
        />
      ) : null}
      <CircleMarker
        center={[location.lat, location.lng]}
        radius={9}
        pathOptions={{
          color: '#ffffff',
          weight: 3,
          fillColor: '#2676D2',
          fillOpacity: 1,
          interactive: false,
          className: 'user-location-pulse',
        }}
      />
    </Pane>
  )
}

/**
 * Fly the camera to the user's position each time a fresh fix arrives. Fixes
 * outside the district are ignored (the map is clamped to Puducherry bounds).
 */
function UserLocateController({ location }: { location: GeoPoint | null }) {
  const map = useMap()
  const lastKey = useRef('')

  useEffect(() => {
    if (!location) {
      return
    }

    const key = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`

    if (key === lastKey.current) {
      return
    }

    lastKey.current = key

    if (!isInsidePuducherry(location.lat, location.lng)) {
      return
    }

    map.flyTo(
      [location.lat, location.lng],
      Math.max(map.getZoom(), 15),
      { duration: 0.6 },
    )
  }, [location, map])

  return null
}

/**
 * Main CRIMEMAP Leaflet map.
 */
export function CrimeMap({
  incidents,
  zones,
  stations,
  selectedArea,
  searchQuery,
  relatedIncidentIds,
  selectedZoneId,
  onSelectZone,
  onSelectIncident,
  onSelectStation,
  onSelectPatrol,
  onDeselect,
  pickingLocation,
  onPickLocation,
  userLocation,
  userAccuracyMeters,
}: CrimeMapProps) {
  const { t } = useI18n()
  const selectedAreaRing =
    selectedArea === ALL_AREAS ? null : areaBoundaryRing(selectedArea)

  return (
    <MapContainer
      center={[PUDUCHERRY_CENTER.lat, PUDUCHERRY_CENTER.lng]}
      zoom={12}
      maxBounds={PUDUCHERRY_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={11}
      maxZoom={18}
      zoomControl={false}
      scrollWheelZoom
      dragging
      touchZoom
      doubleClickZoom
      className="h-full w-full"
    >
      {/* Base maps and optional data layers */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer
          checked
          name={t('OpenStreetMap Standard')}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name={t('OSM Humanitarian (HOT)')}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors, tiles style by HOT hosted by OSM France"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        {/* Puducherry district outline */}
        <LayersControl.Overlay
          checked
          name={t('Puducherry boundary')}
        >
          <LayerGroup>
            <Polygon
              positions={BOUNDARY_POSITIONS}
              pathOptions={{
                color: '#38bdf8',
                weight: 1.5,
                dashArray: '8 6',
                fill: false,
                interactive: false,
              }}
            />
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Crime incidents */}
        <LayersControl.Overlay
          checked
          name={t('Crime incidents')}
        >
          <LayerGroup>
            <IncidentLayer
              incidents={incidents}
              relatedIds={relatedIncidentIds}
              onSelect={onSelectIncident}
            />
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Risk zones */}
        <LayersControl.Overlay
          checked
          name={t('Risk zones')}
        >
          <LayerGroup>
            <RiskZoneLayer
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelect={onSelectZone}
            />
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Police stations */}
        <LayersControl.Overlay
          checked
          name={t('Police stations')}
        >
          <LayerGroup>
            {stations.map((station) => (
              <PoliceStationMarker
                key={station.id}
                station={station}
                onSelect={onSelectStation}
              />
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Simulated patrol units */}
        <LayersControl.Overlay
          checked
          name={t('Patrol units (simulated)')}
        >
          <LayerGroup>
            <PatrolLayer onSelect={onSelectPatrol} />
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      {/* Darken the area outside the selected boundary/spotlight */}
      <Pane
        name="area-mask"
        style={{ zIndex: 350 }}
      >
        <Polygon
          positions={[
            MASK_RING,
            maskHole(selectedArea, selectedAreaRing),
          ]}
          pathOptions={{
            stroke: false,
            fill: true,
            fillColor: '#1E293B',
            fillOpacity: 0.35,
            fillRule: 'evenodd',
            interactive: false,
            className: 'area-mask',
          }}
        />
      </Pane>

      {/* Selected locality boundary outline, styled like the district border */}
      {selectedAreaRing ? (
        <Pane
          name="area-outline"
          style={{ zIndex: 360 }}
        >
          <Polygon
            positions={selectedAreaRing}
            pathOptions={{
              color: '#38bdf8',
              weight: 2,
              dashArray: '8 6',
              fill: false,
              interactive: false,
            }}
          />
        </Pane>
      ) : null}

      {/* Map controls */}
      <ZoomControl position="bottomright" />
      <ScaleControl
        position="bottomleft"
        imperial={false}
      />

      {/* Map camera and interaction controllers */}
      <AreaCameraController
        selectedArea={selectedArea}
        boundary={selectedAreaRing}
      />

      <SearchFocusController
        query={searchQuery}
        incidents={incidents}
      />

      <TapToDismiss
        onDeselect={onDeselect}
      />

      <LocationPicker
        active={pickingLocation}
        onPick={onPickLocation}
      />

      <AutoResize />

      {/* Browser location marker + camera follow */}
      <UserLocateController location={userLocation} />
      {userLocation ? (
        <UserLocationMarker
          location={userLocation}
          accuracyMeters={userAccuracyMeters}
        />
      ) : null}

      {/* Puducherry reference point */}
      <CircleMarker
        center={[
          PUDUCHERRY_CENTER.lat,
          PUDUCHERRY_CENTER.lng,
        ]}
        radius={4}
        pathOptions={{
          color: '#2676D2',
          weight: 2,
          fillColor: '#2676D2',
          fillOpacity: 0.8,
        }}
        interactive={false}
      />
    </MapContainer>
  )
}
