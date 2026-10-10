import L from 'leaflet'
import { Marker } from 'react-leaflet'
import type { CrimeIncident } from '../../types'
import { CRIME_FALLBACK_COLOR, CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { crimeIconSvg } from '../../utils/crimeIcons'

interface CrimeMarkerProps {
  incident: CrimeIncident
  onSelect: (incident: CrimeIncident) => void
}

const PIN_WIDTH = 40
const PIN_HEIGHT = 48
/** Bottom visible tip of the pin (path tip + outline), in icon pixels. */
const PIN_TIP: [number, number] = [20, 48]

/**
 * Geographic teardrop map pin: a coloured pin (2px white outline, soft shadow)
 * with a white crime-type glyph centred in the upper circular head. The pin tip
 * marks the exact coordinate, so `iconAnchor` is the bottom tip and
 * `popupAnchor` opens above the head.
 */
function crimeMarkerIcon(category: CrimeIncident['category']): L.DivIcon {
  const color = CRIME_CATEGORY_COLORS[category] ?? CRIME_FALLBACK_COLOR
  const path =
    'M20 47 C20 47 5 29 5 17 A15 15 0 1 1 35 17 C35 29 20 47 20 47 Z'
  const html =
    `<span class="crime-pin">` +
    `<svg class="crime-pin-shape" width="${PIN_WIDTH}" height="${PIN_HEIGHT}" ` +
    `viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="${path}" fill="${color}" stroke="#ffffff" stroke-width="2" ` +
    `stroke-linejoin="round"/>` +
    `</svg>` +
    `<span class="crime-pin-glyph">${crimeIconSvg(category, '#ffffff', 20)}</span>` +
    `</span>`
  return L.divIcon({
    className: 'crime-pin-wrap',
    html,
    iconSize: [PIN_WIDTH, PIN_HEIGHT],
    iconAnchor: PIN_TIP,
    popupAnchor: [0, -48],
  })
}

/**
 * Single incident rendered as a teardrop icon marker. Tapping it opens the
 * bottom details sheet.
 *
 * `bubblingMouseEvents={false}` keeps the tap from reaching the map so the
 * tap-to-dismiss handler does not close the sheet immediately.
 */
export function CrimeMarker({ incident, onSelect }: CrimeMarkerProps) {
  const handleSelect = () => onSelect(incident)

  return (
    <Marker
      position={[incident.lat, incident.lng]}
      icon={crimeMarkerIcon(incident.category)}
      bubblingMouseEvents={false}
      eventHandlers={{ click: handleSelect }}
    />
  )
}
