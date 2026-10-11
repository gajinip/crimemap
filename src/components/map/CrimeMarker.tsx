import { Marker } from 'react-leaflet'
import type { CrimeIncident } from '../../types'
import { getCrimeIcon } from '../../utils/crimeMapIcon'

interface CrimeMarkerProps {
  incident: CrimeIncident
  onSelect: (incident: CrimeIncident) => void
  related?: boolean
}

/**
 * Single incident rendered as a teardrop icon marker. Tapping it opens the
 * bottom details sheet.
 *
 * `bubblingMouseEvents={false}` keeps the tap from reaching the map so the
 * tap-to-dismiss handler does not close the sheet immediately.
 */
export function CrimeMarker({ incident, onSelect, related = false }: CrimeMarkerProps) {
  const handleSelect = () => onSelect(incident)

  return (
    <Marker
      position={[incident.lat, incident.lng]}
      icon={getCrimeIcon(incident, related)}
      bubblingMouseEvents={false}
      eventHandlers={{ click: handleSelect }}
    />
  )
}
