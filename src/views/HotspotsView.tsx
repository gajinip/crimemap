import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import { RiskZoneCard } from '../components/risk/RiskZoneCard'
import { RiskBreakdown } from '../components/RiskBreakdown'
import { RecommendationCard } from '../components/RecommendationCard'
import { InfoPopover } from '../components/ui/InfoPopover'
import type { Recommendation, RiskZone } from '../types'
import {
  RISK_ACTION_BLUE,
  RISK_ELEVATED_BG,
} from '../utils/riskPalette'

interface HotspotsViewProps {
  zones: RiskZone[]
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
      className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 t-base font-semibold transition-colors ${
        active
          ? 'bg-[#1A73E8] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
          : 'text-[#53647A] hover:text-[#14233B]'
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-px font-mono t-xs ${
          active ? 'bg-white/20 text-white' : 'bg-[#DCE4EE] text-[#53647A]'
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
  recommendations,
  selectedZone,
  onFocusArea,
  onSelectZone,
  onCloseDetails,
}: HotspotsViewProps) {
  const { t } = useI18n()
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

  const selectedRecommendation = selectedZone
    ? (recommendations.find(
        (entry) => entry.zoneId === selectedZone.id || entry.area === selectedZone.area,
      ) ?? null)
    : null

  return (
    <div className="scroll-thin flex min-w-0 flex-col gap-4 p-3 pb-8 xl:p-4">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
                            <h1 className="min-w-0 break-words t-view-title font-bold leading-tight text-[#14233B]">
              {t('Risk Zones')}
            </h1>
            <InfoPopover
              tone="risk"
              label={t('About risk zones')}
              text={t('Monitor high-risk areas and stay informed about potential crime activity. Scores are deterministic and explainable, derived from incident frequency, trend, severity, repeat activity, time of day and proximity.')}
            />
          </div>
          <span className="shrink-0 rounded-lg border border-[#DCE4EE] bg-[#F4F7FB] px-2.5 py-1.5 t-xs font-bold uppercase tracking-[0.14em] text-[#53647A]">
            {t('Synthetic demo data')}
          </span>
        </div>
        <div
          className="flex gap-1 rounded-xl border p-1"
          style={{ backgroundColor: RISK_ELEVATED_BG, borderColor: '#DCE4EE' }}
          role="group"
          aria-label={t('Filter risk zones')}
        >
          <Seg value="active" label={t('Active Zones')} count={activeZones.length} active={scope === 'active'} onChange={setScope} />
          <Seg value="all" label={t('All Zones')} count={sorted.length} active={scope === 'all'} onChange={setScope} />
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-[#DCE4EE] bg-[#F4F7FB] p-4">
          <p className="t-md font-semibold text-[#14233B]">{t('No risk zones detected')}</p>
          <p className="mt-1 t-base text-[#53647A]">
            {t('The engine groups recent incidents by locality and computes 0-100 scores only when enough activity exists in the recent window.')}
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-[#DCE4EE] bg-[#F4F7FB] p-4">
          <p className="t-md font-semibold text-[#14233B]">{t('No active high-risk zones')}</p>
          <p className="mt-1 t-base text-[#53647A]">
            {t('Switch to All Zones to browse every detected locality.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((zone) => (
            <RiskZoneCard
              key={zone.id}
              zone={zone}
              selected={selectedZone?.id === zone.id}
              onView={() => onFocusArea(zone.area)}
              onSelect={() => onSelectZone(zone)}
            />
          ))}
        </div>
      )}

      {selectedZone ? (
        <section className="rounded-2xl border border-[#DCE4EE] bg-[#F4F7FB] p-4">
          <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h2 className="break-words t-lg font-bold text-[#14233B]">
                {t('Hotspot details: {area}', { area: selectedZone.area })}
              </h2>
              <p className="mt-0.5 t-sm text-[#53647A]">
                {t('{id} · Risk score {score} ({level})', { id: selectedZone.id, score: selectedZone.riskScore, level: t('risk.' + selectedZone.riskLevel) })}
              </p>
            </div>
            <button
              type="button"
              onClick={onCloseDetails}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#DCE4EE] bg-[#FFFFFF] px-2.5 py-1.5 t-xs font-semibold text-[#53647A] hover:text-[#14233B]"
            >
              <X className="size-3.5" aria-hidden /> {t('Close details')}
            </button>
          </header>
          <div className="mt-3 flex flex-col gap-3">
            <RiskBreakdown
              zone={selectedZone}
              title={t('Why is {area} high risk?', { area: selectedZone.area })}
            />
            {selectedRecommendation ? (
              <RecommendationCard recommendation={selectedRecommendation} />
            ) : null}
            <div className="grid grid-cols-2 gap-2 t-sm md:grid-cols-4">
              <div className="rounded-lg border border-[#DCE4EE]/60 bg-[#FFFFFF] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#53647A]">{t('Peak time')}</p>
                <p className="mt-0.5 t-base font-semibold text-[#14233B]">{selectedZone.peakWindow}</p>
                <p className="t-xs text-[#53647A]">{t('{share}% of incidents', { share: selectedZone.peakShare })}</p>
              </div>
              <div className="rounded-lg border border-[#DCE4EE]/60 bg-[#FFFFFF] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#53647A]">{t('Repeat spots')}</p>
                <p className="mt-0.5 t-base font-semibold text-[#14233B]">{selectedZone.repeatShare}%</p>
                <p className="t-xs text-[#53647A]">{t('within 250 m')}</p>
              </div>
              <div className="rounded-lg border border-[#DCE4EE]/60 bg-[#FFFFFF] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#53647A]">{t('Previous window')}</p>
                <p className="mt-0.5 t-base font-semibold text-[#14233B]">
                  {t('{count} incidents', { count: selectedZone.previousCount })}
                </p>
                <p className="t-xs text-[#53647A]">{t('now {count}', { count: selectedZone.crimeCount })}</p>
              </div>
              <div className="rounded-lg border border-[#DCE4EE]/60 bg-[#FFFFFF] px-2.5 py-2">
                <p className="font-bold uppercase tracking-[0.12em] text-[#53647A]">{t('Nearby activity')}</p>
                <p className="mt-0.5 t-base font-semibold text-[#14233B]">
                  {t('{count} incidents', { count: selectedZone.nearbyCount })}
                </p>
                <p className="t-xs text-[#53647A]">{t('within 3 km')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFocusArea(selectedZone.area)}
              className="rounded-xl py-2 t-base font-semibold text-white hover:bg-[#4285F4]"
              style={{ backgroundColor: RISK_ACTION_BLUE }}
            >
              {t('Focus map on {area}', { area: selectedZone.area })}
            </button>
          </div>
        </section>
      ) : null}

      {recommendations.length > 0 ? (
        <section className="rounded-2xl border border-[#DCE4EE] bg-[#F4F7FB] p-4">
          <header className="flex flex-col gap-1">
            <h2 className="t-md font-bold text-[#14233B]">{t('Recommended actions')}</h2>
            <p className="t-sm text-[#53647A]">
              {t('{count} actionable items derived from these zones', { count: recommendations.length })}
            </p>
          </header>
          <div className="scroll-thin mt-3 flex snap-x snap-mandatory touch-pan-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-3">
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