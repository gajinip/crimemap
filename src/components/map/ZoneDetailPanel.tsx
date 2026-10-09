import { X } from 'lucide-react'
import type { Recommendation, RiskZone } from '../../types'
import { RecommendationCard } from '../RecommendationCard'
import { RiskBreakdown } from '../RiskBreakdown'
import { DemoChip, TrendIndicator } from '../ui/Badge'

interface ZoneDetailPanelProps {
  zone: RiskZone
  recommendation: Recommendation | null
  onClose: () => void
  onFocusArea: (area: string) => void
}

/**
 * Selected-zone intelligence: explainable score + operational recommendation.
 * Desktop docks it to the right of the map, mobile stacks it under the map.
 */
export function ZoneDetailPanel({
  zone,
  recommendation,
  onClose,
  onFocusArea,
}: ZoneDetailPanelProps) {
  return (
    <aside
      className="pointer-events-auto scroll-thin absolute inset-x-2 bottom-2 z-[1200] max-h-[58vh] overflow-y-auto rounded-xl border border-navy-600 bg-navy-900/97 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-sm xl:inset-x-auto xl:bottom-3 xl:right-3 xl:top-3 xl:max-h-none xl:w-[350px]"
      aria-label={`Risk analysis for ${zone.area}`}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-navy-700 bg-navy-900/97 px-3 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-steel-500">
            Zone analysis · {zone.id}
          </p>
          <h2 className="truncate text-[14px] font-semibold text-white">{zone.area}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TrendIndicator trend={zone.trend} percent={zone.trendPercent} />
            <span className="text-[10px] text-steel-500">
              {zone.crimeCount} incidents · {zone.dominantCrime}
            </span>
            <DemoChip compact />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close zone analysis"
          className="shrink-0 rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex flex-col gap-3 p-3">
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
    </aside>
  )
}
