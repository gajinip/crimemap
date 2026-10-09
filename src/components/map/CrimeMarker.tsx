import L from 'leaflet'
import { Navigation, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import type { CrimeIncident } from '../../types'
import { formatDateTime } from '../../utils/format'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { CategoryBadge, StatusBadge } from '../ui/Badge'

interface CrimeMarkerProps {
  incident: CrimeIncident
  onEdit: (incident: CrimeIncident) => void
  onDelete: (incidentId: string) => void
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
    popupAnchor: [0, -18],
  })
}

/** Single incident rendered as a circle (demo) or a pointer triangle (user-reported). */
export function CrimeMarker({ incident, onEdit, onDelete }: CrimeMarkerProps) {
  const map = useMap()
  const [confirming, setConfirming] = useState(false)
  const color = CRIME_CATEGORY_COLORS[incident.category]

  const popup = (
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
      <div className="popup-demo">
        {incident.isDemo ? 'DEMO DATA - NOT REAL CRIME INFORMATION' : 'USER-REPORTED - NOT VERIFIED'}
      </div>
      <button
        type="button"
        onClick={() => {
          onEdit(incident)
          map.closePopup()
        }}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-amber-500/60 bg-amber-500/15 px-2 py-1.5 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-500/25"
      >
        <Pencil className="size-3.5" aria-hidden /> Edit crime &amp; location
      </button>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded border border-blue-500/60 bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <Navigation className="size-3.5" aria-hidden /> Get directions
      </a>
      {confirming ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onDelete(incident.id)
              map.closePopup()
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded border border-risk-critical/60 bg-risk-critical/20 px-2 py-1.5 text-[11px] font-semibold text-risk-critical transition-colors hover:bg-risk-critical/30"
          >
            <Trash2 className="size-3.5" aria-hidden /> Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded border border-navy-600 bg-navy-800 px-2 py-1.5 text-[11px] font-semibold text-steel-200 transition-colors hover:bg-navy-700 hover:text-white"
          >
            Keep
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded border border-risk-critical/50 bg-transparent px-2 py-1.5 text-[11px] font-semibold text-risk-critical transition-colors hover:bg-risk-critical/15"
        >
          <Trash2 className="size-3.5" aria-hidden /> Delete crime
        </button>
      )}
    </Popup>
  )

  if (!incident.isDemo) {
    return (
      <Marker position={[incident.lat, incident.lng]} icon={triangleIcon(color)}>
        {popup}
      </Marker>
    )
  }

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
      {popup}
    </CircleMarker>
  )
}
