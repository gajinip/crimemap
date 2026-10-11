import type { Recommendation, RiskZone } from '../../types'
import { RecommendationCard } from '../RecommendationCard'
import { RiskBreakdown } from '../RiskBreakdown'
import { DemoChip, TrendIndicator } from '../ui/Badge'
import { DetailSheet } from './DetailSheet'

interface ZoneDetailPanelProps {
  zone: RiskZone
  recommendation: Recommendation | null
  onClose: () => void
  onFocusArea: (area: string) => void
}

/**
 * Selected-zone intelligence shown as a bottom sheet: explainable score plus
 * the operational recommendation. Matches the crime/station detail sheets.
 */
export function ZoneDetailPanel({
  zone,
  recommendation,
  onClose,
  onFocusArea,
}: ZoneDetailPanelProps) {
  return (
    <DetailSheet
      ariaLabel={`Risk analysis for ${zone.area}`}
      onClose={onClose}
      header={
        <>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-steel-500">
            Zone analysis · {zone.id}
          </p>
          <h2 className="truncate text-[14px] font-semibold text-steel-100">{zone.area}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TrendIndicator trend={zone.trend} percent={zone.trendPercent} />
            <span className="text-[10px] text-steel-500">
              {zone.crimeCount} incidents · {zone.dominantCrime}
            </span>
            <DemoChip compact />
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <RiskBreakdown zone={zone} title={`Why is ${zone.area} high risk?`} />

        {recommendation ? <RecommendationCard recommendation={recommendation} /> : null}

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
            <p className="font-bold uppercase tracking-[0.12em] text-steel-500">Peak time</p>
            <p className="mt-0.5 text-[12px] font-semibold text-steel-100">{zone.peakWindow}</p>
            <p className="text-steel-500">{zone.peakShare}% of incidents</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
            <p className="font-bold uppercase tracking-[0.12em] text-steel-500">Repeat spots</p>
            <p className="mt-0.5 text-[12px] font-semibold text-steel-100">{zone.repeatShare}%</p>
            <p className="text-steel-500">within 250 m</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
            <p className="font-bold uppercase tracking-[0.12em] text-steel-500">Previous window</p>
            <p className="mt-0.5 text-[12px] font-semibold text-steel-100">
              {zone.previousCount} incidents
            </p>
            <p className="text-steel-500">now {zone.crimeCount}</p>
          </div>
          <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
            <p className="font-bold uppercase tracking-[0.12em] text-steel-500">Nearby activity</p>
            <p className="mt-0.5 text-[12px] font-semibold text-steel-100">
              {zone.nearbyCount} incidents
            </p>
            <p className="text-steel-500">within 3 km</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onFocusArea(zone.area)}
          className="rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-500"
        >
          Focus map on {zone.area}
        </button>
      </div>
    </DetailSheet>
  )
}