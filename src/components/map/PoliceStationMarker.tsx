import { Marker } from 'react-leaflet'
import type { PoliceStation } from '../../types'
import { policeStationIcon } from './policeIcon'

interface PoliceStationMarkerProps {
  station: PoliceStation
  onSelect: (station: PoliceStation) => void
}

/**
 * Police station marker. Tapping it opens the station detail bottom sheet.
 * `bubblingMouseEvents={false}` keeps the tap from reaching the map so the
 * tap-to-dismiss handler does not close the sheet immediately.
 */
export function PoliceStationMarker({ station, onSelect }: PoliceStationMarkerProps) {
  return (
    <Marker
      position={[station.lat, station.lng]}
      icon={policeStationIcon}
      bubblingMouseEvents={false}
      eventHandlers={{ click: () => onSelect(station) }}
    />
  )
}
