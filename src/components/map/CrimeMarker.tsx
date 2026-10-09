import { Navigation, X } from 'lucide-react'
import { CircleMarker, Popup, useMap } from 'react-leaflet'
import type { CrimeIncident } from '../../types'
import { formatDateTime } from '../../utils/format'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { CategoryBadge, StatusBadge } from '../ui/Badge'

interface CrimeMarkerProps {
  incident: CrimeIncident
}

/** Single demo incident rendered as a category-coloured circle marker. */
export function CrimeMarker({ incident }: CrimeMarkerProps) {
  const map = useMap()
  const color = CRIME_CATEGORY_COLORS[incident.category]

  return (
    <CircleMarker
      center={[incident.lat, incident.lng]}
      radius={7}
      pathOptions={{
        color: '#050a14',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.92,
      }}
    >
      <Popup minWidth={250}>
        <div className="popup-title">{incident.category}</div>
        <div className="popup-sub">
          {incident.id} &middot; {incident.area}
        </div>
        <div className="popup-row">
          <span>Occurred</span>
          <span>{formatDateTime(incident.occurredAt)}</span>
        </div>
        <div className="popup-row">
          <span>Status</span>
          <span>{incident.status}</span>
        </div>
        <div className="popup-row">
          <span>Coordinates</span>
          <span>
            {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
          </span>
        </div>
        <div className="popup-row">
          <span>Details</span>
          <span className="max-w-[150px]">{incident.description}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <CategoryBadge category={incident.category} />
          <StatusBadge status={incident.status} />
        </div>
        <div className="popup-demo">DEMO DATA - NOT REAL CRIME INFORMATION</div>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-blue-500/60 bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Navigation className="size-3.5" aria-hidden /> Get directions
        </a>
        <button
          type="button"
          onClick={() => map.closePopup()}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded border border-navy-600 bg-navy-800 px-2 py-1.5 text-[11px] font-semibold text-steel-200 transition-colors hover:bg-navy-700 hover:text-white"
        >
          <X className="size-3.5" aria-hidden /> Close incident
        </button>
      </Popup>
    </CircleMarker>
  )
}
