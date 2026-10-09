import { useEffect, useRef } from 'react'
import {
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
import { DEMO_AREAS, PUDUCHERRY_CENTER } from '../../data/areas'
import boundary from '../../data/puducherry-boundary.json'
import type { CrimeIncident, GeoPoint, PoliceStation, RiskZone } from '../../types'
import { ALL_AREAS } from '../../utils/filters'
import { IncidentLayer } from './ClusterLayer'
import { PatrolLayer } from './PatrolLayer'
import { PoliceStationMarker } from './PoliceStationMarker'
import { RiskZoneLayer } from './RiskZoneLayer'

/** Default view: fits the Puducherry district extent (lat/lng corners). */
const PUDUCHERRY_BOUNDS: [[number, number], [number, number]] = [
  [boundary.bbox.south, boundary.bbox.west], // southwest
  [boundary.bbox.north, boundary.bbox.east], // northeast
]

/** District outline as [lat, lng] for react-leaflet. */
const BOUNDARY_POSITIONS: [number, number][] = boundary.outer.map(([lng, lat]) => [lat, lng])

/** Mercator-safe world rectangle used as the outer ring of the dimming mask. */
const WORLD_RING: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
]

/** Radius (degrees) of the spotlight revealed around a single selected area. */
const AREA_SPOTLIGHT_RADIUS = 0.008

/** Builds a closed circular ring centred on a coordinate. */
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
 * Hole punched through the black mask: the whole district by default, or a
 * spotlight around a single area when one is selected.
 */
function maskHole(selectedArea: string): [number, number][] {
  if (selectedArea !== ALL_AREAS) {
    const area = DEMO_AREAS.find((entry) => entry.name === selectedArea)
    if (area) return buildSpotlightRing(area.lat, area.lng, AREA_SPOTLIGHT_RADIUS)
  }
  return BOUNDARY_POSITIONS
}

interface CrimeMapProps {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  stations: PoliceStation[]
  selectedArea: string
  searchQuery: string
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
  onEditIncident: (incident: CrimeIncident) => void
  onDeleteIncident: (incidentId: string) => void
  pickingLocation: boolean
  onPickLocation: (point: GeoPoint) => void
}

/** Pans the camera when the header area selector changes. */
function AreaCameraController({ selectedArea }: { selectedArea: string }) {
  const map = useMap()

  useEffect(() => {
    if (selectedArea === ALL_AREAS) {
      map.flyToBounds(PUDUCHERRY_BOUNDS, { duration: 0.35, maxZoom: 14, padding: [20, 20] })
      return
    }
    const area = DEMO_AREAS.find((entry) => entry.name === selectedArea)
    if (area) {
      map.flyTo([area.lat, area.lng], Math.max(map.getZoom(), 14), { duration: 0.35 })
    }
  }, [map, selectedArea])

  return null
}

/** Flies the camera to the best-matching incident when the search changes. */
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
    if (trimmed === lastQuery.current) return
    lastQuery.current = trimmed

    const match = incidents[0]
    if (!match) return
    map.flyTo([match.lat, match.lng], Math.max(map.getZoom(), 16), { duration: 0.6 })
  }, [query, incidents, map])

  return null
}

/** Captures the next map click as a new incident location when armed. */
function LocationPicker({
  active,
  onPick,
}: {
  active: boolean
  onPick: (point: GeoPoint) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!active) return
    const handleClick = (event: LeafletMouseEvent) => {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng })
    }
    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [active, map, onPick])

  return null
}

/** Provides the primary interactive Leaflet map surface. */
export function CrimeMap({
  incidents,
  zones,
  stations,
  selectedArea,
  searchQuery,
  selectedZoneId,
  onSelectZone,
  onEditIncident,
  onDeleteIncident,
  pickingLocation,
  onPickLocation,
}: CrimeMapProps) {
  return (
    <MapContainer
      bounds={PUDUCHERRY_BOUNDS}
      boundsOptions={{ padding: [20, 20] }}
      minZoom={3}
      maxZoom={18}
      zoomControl={false}
      scrollWheelZoom
      dragging
      touchZoom
      doubleClickZoom
      className="h-full w-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap Standard">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="OSM Humanitarian (HOT)">
          <TileLayer
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors, tiles style by HOT hosted by OSM France'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Puducherry boundary">
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

        <LayersControl.Overlay checked name="Crime incidents">
          <LayerGroup>
            <IncidentLayer
              incidents={incidents}
              onEdit={onEditIncident}
              onDelete={onDeleteIncident}
            />
          </LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Risk zones">
          <LayerGroup>
            <RiskZoneLayer
              zones={zones}
              selectedZoneId={selectedZoneId}
              onSelect={onSelectZone}
            />
          </LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Police stations">
          <LayerGroup>
            {stations.map((station) => (
              <PoliceStationMarker key={station.id} station={station} />
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay checked name="Patrol units (simulated)">
          <LayerGroup>
            <PatrolLayer />
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>

      <Pane name="area-mask" style={{ zIndex: 350 }}>
        <Polygon
          positions={[WORLD_RING, maskHole(selectedArea)]}
          pathOptions={{
            stroke: false,
            fill: true,
            fillColor: '#000000',
            fillOpacity: 1,
            fillRule: 'evenodd',
            interactive: false,
            className: 'area-mask',
          }}
        />
      </Pane>

      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" imperial={false} />
      <AreaCameraController selectedArea={selectedArea} />
      <SearchFocusController query={searchQuery} incidents={incidents} />
      <LocationPicker active={pickingLocation} onPick={onPickLocation} />

      <CircleMarker
        center={[PUDUCHERRY_CENTER.lat, PUDUCHERRY_CENTER.lng]}
        radius={4}
        pathOptions={{ color: '#60a5fa', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.8 }}
      />
    </MapContainer>
  )
}
