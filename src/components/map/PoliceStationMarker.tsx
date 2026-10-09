import { Marker, Popup } from 'react-leaflet'
import type { PoliceStation } from '../../types'
import { policeStationIcon } from './policeIcon'

interface PoliceStationMarkerProps {
  station: PoliceStation
}

export function PoliceStationMarker({ station }: PoliceStationMarkerProps) {
  return (
    <Marker position={[station.lat, station.lng]} icon={policeStationIcon}>
      <Popup minWidth={240}>
        <div className="popup-title">{station.name}</div>
        <div className="popup-sub">
          {station.id} &middot; {station.area}
        </div>
        <div className="popup-row">
          <span>Type</span>
          <span>Police station (demo)</span>
        </div>
        <div className="popup-row">
          <span>Jurisdiction</span>
          <span className="max-w-[150px]">{station.jurisdiction.join(', ')}</span>
        </div>
        <div className="popup-row">
          <span>Coordinates</span>
          <span>
            {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
          </span>
        </div>
        <div className="popup-demo">DEMO DATA - NOT REAL STATION INFORMATION</div>
      </Popup>
    </Marker>
  )
}
