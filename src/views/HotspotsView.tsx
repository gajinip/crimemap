import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { RiskZoneCard } from '../components/risk/RiskZoneCard'
import { RiskBreakdown } from '../components/RiskBreakdown'
import { RecommendationCard } from '../components/RecommendationCard'
import type { CrimeIncident, Recommendation, RiskZone } from '../types'
import {
  RISK_ACTION_BLUE,
  RISK_BG,
  RISK_ELEVATED_BG,
} from '../utils/riskPalette'
import { zoneDailySeries } from '../utils/zoneSeries'

interface HotspotsViewProps {
  zones: RiskZone[]
  incidents: CrimeIncident[]
  recommendations: Recommendation[]
  selectedZone: RiskZone | null
  onFocusArea: (area: string) => void
  onSelectZone: (zone: RiskZone) => void
  onCloseDetails: () => void
}

type Scope = 'active' | 'all'

function Seg({
  value,
  label,
  count,
  active,
  onChange,
}: {
  value: Scope
  label: string
  count: number
  active: boolean
  onChange: (value: Scope) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onChange(value)}
      className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-[#087BFF] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
          : 'text-[#8DB5DE] hover:text-[#F4F7FC]'
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-px font-mono text-[10px] ${
          active ? 'bg-white/20 text-white' : 'bg-[#123B67] text-[#8DB5DE]'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

/** Reference-style Risk Zones page: filter rail, score-ring cards, detach detail. */
export function HotspotsView({
  zones,
  incidents,
  recommendations,
  selectedZone,
  onFocusArea,
  onSelectZone,
  onCloseDetails,
}: HotspotsViewProps) {
  const [scope, setScope] = useState<Scope>('active')
  const sorted = useMemo(
    () => [...zones].sort((a, b) => b.riskScore - a.riskScore),
    [zones],
  )
  const activeZones = useMemo(
    () => sorted.filter((zone) => zone.status === 'Active'),
    [sorted],
  )
  const visible = scope === 'active' ? activeZones : sorted

  const seriesByArea = useMemo(() => {
    const map: Record<string, number[]> = {}
    for (const zone of sorted) {
      map[zone.area] = zoneDailySeries(incidents, zone.area)
    }
    return map
  }, [sorted, incidents])

  const selectedRecommendation = selectedZone
    ? (recommendations.find(
        (entry) => entry.zoneId === selectedZone.id || entry.area === selectedZone.area,
      ) ?? null)
    : null

  return (
    <div
      className="scroll-thin flex min-w-0 flex-col gap-4 p-3 pb-8 xl:p-4"
      style={{ backgroundColor: RISK_BG }}
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <h1 className="min-w-0 break-words text-[clamp(20px,4vw,26px)] font-bold leading-tight text-[#F4F7FC]">
            Risk Zones
          </h1>
          <span className="shrink-0 rounded-lg border border-[#123B67] bg-[#0A203B] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8DB5DE]">
            Synthetic demo data
          </span>
        </div>
        <p className="max-w-3xl text-[12px] leading-relaxed text-[#8DB5DE]">
          Monitor high-risk areas and stay informed about potential crime activity. Scores
          are deterministic and explainable, derived from incident frequency, trend,
          severity, repeat activity, time of day and proximity.
        </p>
        <div
          className="flex gap-1 rounded-xl border p-1"
          style={{ backgroundColor: RISK_ELEVATED_BG, borderColor: '#123B67' }}
          role="group"
          aria-label="Filter risk zones"
        >
          <Seg value="active" label="Active Zones" count={activeZones.length} active={scope === 'active'} onChange={setScope} />
          <Seg value="all" label="All Zones" count={sorted.length} active={scope === 'all'} onChange={setScope} />
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-[#123B67] bg-[#0A203B] p-4">
          <p className="text-[14px] font-semibold text-[#F4F7FC]">No risk zones detected</p>
          <p className="mt-1 text-[12px] text-[#8DB5DE]">
            The engine groups recent incidents by locality and computes 0-100 scores only
            when enough activity exists in the recent window.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-[#123B67] bg-[#0A203B] p-4">
          <p className="text-[14px] font-semibold text-[#F4F7FC]">No active high-risk zones</p>
          <p className="mt-1 text-[12px] text-[#8DB5DE]">
            Switch to All Zones to browse every detected locality.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 content-start gap-3">
          {visible.map((zone) => (
            <RiskZoneCard
              key={zone.id}
              zone={zone}
              series={seriesByArea[zone.area] ?? []}
              selected={selectedZone?.id === zone.id}
              onView={() => onFocusArea(zone.area)}
              onSelect={() => onSelectZone(zone)}
            />
          ))}
        </div>
      )}

      {selectedZone ? (
        <section className="rounded-2xl border border-[#123B67] bg-[#0A203B] p-4">
          <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h2 className="break-words text-[15px] font-bold text-[#F4F7FC]">
                Hotspot details: {selectedZone.area}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8DB5DE]">
                {selectedZone.id} · Risk score {selectedZone.riskScore} ({selectedZone.riskLevel})
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseDetails}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#123B67] bg-[#06182D] px-2.5 py-1.5 text-[10px] font-semibold text-[#8DB5DE] hover:text-[#F4F7FC]"
            >
              <X className="size-3.5" aria-hidden /> Close details
            </button>
          </header>
          <div className="mt-3 flex flex-col gap-3">
            <RiskBreakdown
              zone={selectedZone}
              title={`Why is ${selectedZone.area} high risk?`}
            />
            {selectedRecommendation ? (
              <RecommendationCard recommendation={selectedRecommendation} />
            ) : null}
            <div className="grid grid-cols-2 gap-2 text-[11px] md:grid-cols-4">
              <div className="rounded-lg border border-[#123B67]/60 bg-[#06182D] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#8DB5DE]">Peak time</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#F4F7FC]">{selectedZone.peakWindow}</p>
                <p className="text-[10px] text-[#8DB5DE]">{selectedZone.peakShare}% of incidents</p>
              </div>
              <div className="rounded-lg border border-[#123B67]/60 bg-[#06182D] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#8DB5DE]">Repeat spots</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#F4F7FC]">{selectedZone.repeatShare}%</p>
                <p className="text-[10px] text-[#8DB5DE]">within 250 m</p>
              </div>
              <div className="rounded-lg border border-[#123B67]/60 bg-[#06182D] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#8DB5DE]">Previous window</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#F4F7FC]">
                  {selectedZone.previousCount} incidents
                </p>
                <p className="text-[10px] text-[#8DB5DE]">now {selectedZone.crimeCount}</p>
              </div>
              <div className="rounded-lg border border-[#123B67]/60 bg-[#06182D] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#8DB5DE]">Nearby activity</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#F4F7FC]">
                  {selectedZone.nearbyCount} incidents
                </p>
                <p className="text-[10px] text-[#8DB5DE]">within 3 km</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFocusArea(selectedZone.area)}
              className="rounded-xl py-2 text-[12px] font-semibold text-white hover:bg-[#3b97ff]"
              style={{ backgroundColor: RISK_ACTION_BLUE }}
            >
              Focus map on {selectedZone.area}
            </button>
          </div>
        </section>
      ) : null}

      {recommendations.length > 0 ? (
        <section className="rounded-2xl border border-[#123B67] bg-[#0A203B] p-4">
          <header className="flex flex-col gap-1">
            <h2 className="text-[14px] font-bold text-[#F4F7FC]">Recommended actions</h2>
            <p className="text-[11px] text-[#8DB5DE]">
              {recommendations.length} actionable items derived from these zones
            </p>
          </header>
          <div className="scroll-thin mt-3 flex snap-x snap-mandatory touch-pan-x gap-3 overflow-x-auto pb-1">
            {recommendations.slice(0, 6).map((recommendation) => (
              <div key={recommendation.zoneId} className="w-full shrink-0 snap-center">
                <RecommendationCard recommendation={recommendation} compact plain />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}