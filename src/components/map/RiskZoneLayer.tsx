import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Circle, Popup, useMap } from 'react-leaflet'
import type { RiskZone } from '../../types'
import { formatPercent } from '../../utils/format'
import { RISK_LEVEL_COLORS } from '../../utils/visuals'
import { RiskBadge, TrendIndicator } from '../ui/Badge'

interface RiskZoneLayerProps {
  zones: RiskZone[]
  selectedZoneId: string | null
  onSelect: (zoneId: string) => void
}

/** Translucent, colour-coded risk zones computed by the analytics engine. */
export function RiskZoneLayer({ zones, selectedZoneId, onSelect }: RiskZoneLayerProps) {
  const map = useMap()

  /** Dismiss the zone popup whenever the selected zone is cleared. */
  useEffect(() => {
    if (selectedZoneId === null) {
      map.closePopup()
    }
  }, [selectedZoneId, map])

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
            }}
          >
            <Popup minWidth={260}>
              <div className="popup-title">
                {zone.area} <span className="text-steel-400">({zone.id})</span>
              </div>
              <div className="popup-sub">Detected risk zone - engine v1</div>
              <div className="popup-row">
                <span>Risk score</span>
                <span style={{ color }}>
                  {zone.riskScore} / 100
                </span>
              </div>
              <div className="popup-row">
                <span>Recent incidents</span>
                <span>
                  {zone.crimeCount} (prev {zone.previousCount})
                </span>
              </div>
              <div className="popup-row">
                <span>Trend</span>
                <span>
                  {zone.trend} ({formatPercent(zone.trendPercent)})
                </span>
              </div>
              <div className="popup-row">
                <span>Dominant crime</span>
                <span>{zone.dominantCrime}</span>
              </div>
              <div className="popup-row">
                <span>Peak time</span>
                <span>{zone.peakWindow}</span>
              </div>
              <div className="popup-row">
                <span>Zone radius</span>
                <span>{zone.radiusMeters} m</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <RiskBadge level={zone.riskLevel} />
                <TrendIndicator trend={zone.trend} percent={zone.trendPercent} />
              </div>
              <div className="popup-demo">DEMO DATA - NOT REAL CRIME INFORMATION</div>
              <button
                type="button"
                onClick={() => map.closePopup()}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-navy-600 bg-navy-800 px-2 py-1.5 text-[11px] font-semibold text-steel-200 transition-colors hover:bg-navy-700 hover:text-white"
              >
                <X className="size-3.5" aria-hidden /> Close hotspot
              </button>
            </Popup>
          </Circle>
        )
      })}
    </>
  )
}
