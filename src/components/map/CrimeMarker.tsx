import L from 'leaflet'
import { CircleMarker, Marker } from 'react-leaflet'
import type { CrimeIncident } from '../../types'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'

interface CrimeMarkerProps {
  incident: CrimeIncident
  onSelect: (incident: CrimeIncident) => void
}

/** Downward triangle whose tip points at the exact coordinate. */
function triangleIcon(color: string): L.DivIcon {
  const svg =
    `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M11 21 L2 3 L20 3 Z" fill="${color}" stroke="#050a14" stroke-width="1.6" stroke-linejoin="round"/>` +
    `</svg>`
  return L.divIcon({
    className: 'crime-triangle-wrap',
    html: svg,
    iconSize: [22, 22],
    iconAnchor: [11, 21],
  })
}

/**
 * Single incident rendered as a circle (demo) or a pointer triangle
 * (user-reported). Tapping it opens the bottom details sheet.
 *
 * `bubblingMouseEvents={false}` keeps the tap from reaching the map
 * so the tap-to-dismiss handler does not close the sheet immediately.
 */
export function CrimeMarker({ incident, onSelect }: CrimeMarkerProps) {
  const color = CRIME_CATEGORY_COLORS[incident.category]
  const handleSelect = () => onSelect(incident)

  if (!incident.isDemo) {
    return (
      <Marker
        position={[incident.lat, incident.lng]}
        icon={triangleIcon(color)}
        bubblingMouseEvents={false}
        eventHandlers={{ click: handleSelect }}
      />
    )
  }

  return (
    <CircleMarker
      center={[incident.lat, incident.lng]}
      radius={7}
      bubblingMouseEvents={false}
      pathOptions={{
        color: '#050a14',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.92,
      }}
      eventHandlers={{ click: handleSelect }}
    />
  )
}