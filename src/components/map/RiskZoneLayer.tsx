import { Circle } from 'react-leaflet'
import type { RiskZone } from '../../types'
import { RISK_LEVEL_COLORS } from '../../utils/visuals'

interface RiskZoneLayerProps {
  zones: RiskZone[]
  selectedZoneId: string | null
  onSelect: (zoneId: string) => void
}

/** Translucent, colour-coded risk zones computed by the analytics engine. */
export function RiskZoneLayer({ zones, selectedZoneId, onSelect }: RiskZoneLayerProps) {
  return (
    <>
      {zones.map((zone) => {
        const color = RISK_LEVEL_COLORS[zone.riskLevel]
        const selected = zone.id === selectedZoneId
        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radiusMeters}
            eventHandlers={{
              click: () => onSelect(zone.id),
            }}
            pathOptions={{
              color: selected ? '#ffffff' : color,
              weight: selected ? 2.5 : 1.5,
              dashArray: zone.status === 'Contained' ? '4 6' : undefined,
              fillColor: color,
              fillOpacity: selected ? 0.28 : 0.16,
              interactive: true,
              bubblingMouseEvents: false,
            }}
          />
        )
      })}
    </>
  )
}