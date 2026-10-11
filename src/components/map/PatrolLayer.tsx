import L from 'leaflet'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { GeoPoint } from '../../types'
import { usePatrol } from '../../patrol/usePatrol'
import type { DisplayPatrolUnit } from '../../patrol/patrolStore'

/** At or above this zoom every unit shows its full icon; below it, a dot. */
const PATROL_LABEL_ZOOM = 13

const STATUS_COLORS: Record<string, string> = {
  Standby: '#94a3b8',
  Deploying: '#facc15',
  Patrolling: '#22c55e',
}

function patrolIcon(status: string, label: string): L.DivIcon {
  const color = STATUS_COLORS[status] ?? '#94a3b8'
  return L.divIcon({
    className: 'patrol-marker-wrap',
    html:
      `<div class="patrol-marker" style="--patrol-color:${color}" role="img" aria-label="${label}">` +
      `<svg viewBox="0 0 24 24" aria-hidden="true">` +
      `<path d="M3 11 5 5h14l2 6v6h-3v-2H6v2H3v-6z"/>` +
      `<circle cx="7.5" cy="15.5" r="1.6" fill="#0d1526"/>` +
      `<circle cx="16.5" cy="15.5" r="1.6" fill="#0d1526"/>` +
      `</svg></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

/** Compact status dot used when zoomed out so units do not clutter the map. */
function patrolDotIcon(status: string): L.DivIcon {
  const color = STATUS_COLORS[status] ?? '#94a3b8'
  return L.divIcon({
    className: 'patrol-dot-wrap',
    html: `<span class="patrol-dot" style="--patrol-color:${color}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

interface PatrolLayerProps {
  /** Optional boundary test; units outside the city boundary are hidden. */
  isInside?: (point: GeoPoint) => boolean
  onSelect: (unit: DisplayPatrolUnit) => void
}

/** Animated patrol units driven by the simulation context. */
export function PatrolLayer({ isInside, onSelect }: PatrolLayerProps) {
  const { t } = useI18n()
  const { units } = usePatrol()
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  })

  const visibleUnits = useMemo(
    () => (isInside ? units.filter((unit) => isInside({ lat: unit.displayLat, lng: unit.displayLng })) : units),
    [units, isInside],
  )

  const showLabel = zoom >= PATROL_LABEL_ZOOM
  const patrolUnitLabel = t('Patrol unit')
  const icons = useMemo(
    () =>
      new Map(
        visibleUnits.map((unit) => [
          unit.id,
          showLabel
            ? patrolIcon(unit.displayStatus, patrolUnitLabel)
            : patrolDotIcon(unit.displayStatus),
        ]),
      ),
    [visibleUnits, showLabel, patrolUnitLabel],
  )

  return (
    <>
      {visibleUnits.map((unit) => (
        <Marker
          key={unit.id}
          position={[unit.displayLat, unit.displayLng]}
          icon={icons.get(unit.id)}
          zIndexOffset={600}
          bubblingMouseEvents={false}
          eventHandlers={{ click: () => onSelect(unit) }}
        />
      ))}
    </>
  )
}
