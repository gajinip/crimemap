import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'
import { useMemo } from 'react'
import type { GeoPoint } from '../../types'
import { usePatrol } from '../../patrol/usePatrol'

const STATUS_COLORS: Record<string, string> = {
  Standby: '#94a3b8',
  Deploying: '#facc15',
  Patrolling: '#22c55e',
}

function patrolIcon(callsign: string, status: string): L.DivIcon {
  const color = STATUS_COLORS[status] ?? '#94a3b8'
  return L.divIcon({
    className: 'patrol-marker-wrap',
    html: `<span class="patrol-marker" style="--patrol-color:${color}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 5 5h14l2 6v6h-3v-2H6v2H3v-6z"/><circle cx="7.5" cy="15.5" r="1.6" fill="#050a14"/><circle cx="16.5" cy="15.5" r="1.6" fill="#050a14"/></svg><b>${callsign}</b></span>`,
    iconSize: [54, 24],
    iconAnchor: [27, 12],
  })
}

interface PatrolLayerProps {
  /** Optional boundary test; units outside the city boundary are hidden. */
  isInside?: (point: GeoPoint) => boolean
}

/** Animated patrol units driven by the simulation context. */
export function PatrolLayer({ isInside }: PatrolLayerProps = {}) {
  const { units } = usePatrol()
  const visibleUnits = useMemo(
    () => (isInside ? units.filter((unit) => isInside({ lat: unit.displayLat, lng: unit.displayLng })) : units),
    [units, isInside],
  )
  const icons = useMemo(
    () => new Map(visibleUnits.map((unit) => [unit.id, patrolIcon(unit.callsign, unit.displayStatus)])),
    [visibleUnits],
  )

  return (
    <>
      {visibleUnits.map((unit) => (
        <Marker
          key={unit.id}
          position={[unit.displayLat, unit.displayLng]}
          icon={icons.get(unit.id)}
          zIndexOffset={600}
        >
          <Popup minWidth={240}>
            <div className="popup-title">
              {unit.callsign} <span className="text-steel-400">({unit.id})</span>
            </div>
            <div className="popup-sub">Simulated patrol unit - demo only</div>
            <div className="popup-row">
              <span>Status</span>
              <span style={{ color: STATUS_COLORS[unit.displayStatus] }}>{unit.displayStatus}</span>
            </div>
            <div className="popup-row">
              <span>Base</span>
              <span>{unit.stationName}</span>
            </div>
            <div className="popup-row">
              <span>Assigned zone</span>
              <span>{unit.zoneArea}</span>
            </div>
            <div className="popup-row">
              <span>ETA</span>
              <span>{unit.etaMinutes > 0 ? `${unit.etaMinutes} min` : 'On station'}</span>
            </div>
            <div className="popup-demo">SIMULATED UNITS - NOT LIVE VEHICLE DATA</div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
