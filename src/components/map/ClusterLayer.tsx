import { useMemo, useState } from 'react'
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { CrimeCategory, CrimeIncident } from '../../types'
import { CrimeMarker } from './CrimeMarker'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'

/** Below this zoom level incidents collapse into locality clusters. */
const CLUSTER_ZOOM = 13

interface ClusterGroup {
  area: string
  lat: number
  lng: number
  count: number
  dominant: CrimeCategory
  counts: { category: CrimeCategory; count: number }[]
}

function clusterIcon(group: ClusterGroup): L.DivIcon {
  const color = CRIME_CATEGORY_COLORS[group.dominant]
  return L.divIcon({
    className: 'cluster-marker-wrap',
    html: `<span class="cluster-marker" style="--cluster-color:${color}">${group.count}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function groupIncidents(incidents: CrimeIncident[]): ClusterGroup[] {
  const byArea = new Map<string, CrimeIncident[]>()
  for (const incident of incidents) {
    const entry = byArea.get(incident.area)
    if (entry) entry.push(incident)
    else byArea.set(incident.area, [incident])
  }

  const groups: ClusterGroup[] = []
  for (const [area, records] of byArea) {
    if (records.length < 2) continue
    const categoryCounts = new Map<CrimeCategory, number>()
    let lat = 0
    let lng = 0
    for (const record of records) {
      categoryCounts.set(record.category, (categoryCounts.get(record.category) ?? 0) + 1)
      lat += record.lat
      lng += record.lng
    }
    let dominant: CrimeCategory = records[0].category
    let dominantCount = 0
    for (const [category, count] of categoryCounts) {
      if (count > dominantCount) {
        dominantCount = count
        dominant = category
      }
    }
    groups.push({
      area,
      lat: lat / records.length,
      lng: lng / records.length,
      count: records.length,
      dominant,
      counts: [...categoryCounts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    })
  }
  return groups
}

/**
 * Zoom-dependent clustering: localities collapse into a single count marker
 * when zoomed out, and the individual incident markers return when zoomed in.
 */
export function IncidentLayer({ incidents }: { incidents: CrimeIncident[] }) {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  })

  const groups = useMemo(
    () => (zoom < CLUSTER_ZOOM ? groupIncidents(incidents) : []),
    [zoom, incidents],
  )

  if (zoom >= CLUSTER_ZOOM) {
    return (
      <>
        {incidents.map((incident) => (
          <CrimeMarker key={incident.id} incident={incident} />
        ))}
      </>
    )
  }

  return (
    <>
      {groups.map((group) => (
        <Marker
          key={`cluster-${group.area}`}
          position={[group.lat, group.lng]}
          icon={clusterIcon(group)}
          eventHandlers={{
            click: () => map.flyTo([group.lat, group.lng], 15, { duration: 0.4 }),
          }}
        >
          <Popup minWidth={230}>
            <div className="popup-title">{group.area}</div>
            <div className="popup-sub">{group.count} incidents in view (clustered)</div>
            {group.counts.slice(0, 5).map((entry) => (
              <div key={entry.category} className="popup-row">
                <span>{entry.category}</span>
                <span>{entry.count}</span>
              </div>
            ))}
            <div className="popup-demo">DEMO DATA - NOT REAL CRIME INFORMATION</div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
