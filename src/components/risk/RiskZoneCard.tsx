import {
  Activity,
  Flame,
  Gauge,
  MapPin,
  Minus,
  Radar,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { RiskLevel, RiskZone, TrendDirection } from '../../types'
import { RISK_LEVEL_COLOR, TREND_COLOR } from '../../utils/riskPalette'
import { RiskScoreRing } from './RiskScoreRing'

const LEVEL_ICON: Record<RiskLevel, ReactNode> = {
  Critical: <Flame className="size-3.5" aria-hidden />,
  High: <Flame className="size-3.5" aria-hidden />,
  Medium: <Gauge className="size-3.5" aria-hidden />,
  Low: <ShieldCheck className="size-3.5" aria-hidden />,
}

function TrendBadge({ trend, change }: { trend: TrendDirection; change: number }) {
  const { t } = useI18n()
  const color = TREND_COLOR[trend]
  const Icon =
    trend === 'Rising' ? TrendingUp : trend === 'Declining' ? TrendingDown : Minus
  const text = t('{change} incidents', { change: `${change > 0 ? '+' : ''}${change}` })
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 t-sm font-bold"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      <Icon className="size-3.5" aria-hidden />
      {text}
    </span>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#D9E2EF]/60 bg-[#F4F7FB]/70 px-2.5 py-2">
      <p className="truncate t-2xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
        {label}
      </p>
      <p className="mt-0.5 truncate t-base font-semibold text-[#172B4D]">{value}</p>
      {hint ? <p className="truncate t-xs text-[#64748B]">{hint}</p> : null}
    </div>
  )
}

interface RiskZoneCardProps {
  zone: RiskZone
  selected: boolean
  onView: () => void
  onSelect: () => void
}

/** Reference-style risk zone card: severity badge, score ring, trend, stats. */
export function RiskZoneCard({
  zone,
  selected,
  onView,
  onSelect,
}: RiskZoneCardProps) {
  const { t } = useI18n()
  const color = RISK_LEVEL_COLOR[zone.riskLevel]

  return (
    <article
      className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[#FFFFFF] p-4"
      style={{
        border: `1px solid ${color}${selected ? 'CC' : '55'}`,
      }}
      aria-labelledby={`zone-title-${zone.id}`}
    >
      <header className="flex items-start justify-between gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 t-xs font-bold uppercase tracking-[0.1em]"
          style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
        >
          {LEVEL_ICON[zone.riskLevel]}
          {t('{level} risk', { level: t('risk.' + zone.riskLevel) })}
        </span>
        <span className="shrink-0 rounded-md border border-[#D9E2EF] bg-[#F4F7FB] px-1.5 py-0.5 font-mono t-xs font-semibold text-[#64748B]">
          {zone.id}
        </span>
      </header>

      <button
        type="button"
        onClick={onSelect}
        className="block min-w-0 text-left"
        aria-label={t('View details for {area} ({level} risk, score {score})', { area: zone.area, level: t('risk.' + zone.riskLevel), score: zone.riskScore })}
      >
        <h3
          id={`zone-title-${zone.id}`}
          className="break-words t-title-sm font-semibold leading-snug text-[#172B4D]"
        >
          {zone.area}
        </h3>
        <p className="mt-0.5 t-sm text-[#64748B]">
          {t('{status} · {count} recent incidents', { status: t('hotspot.' + zone.status), count: zone.crimeCount })}
        </p>
      </button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <RiskScoreRing score={zone.riskScore} level={zone.riskLevel} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <p className="t-2xs font-bold uppercase tracking-[0.14em] text-[#64748B]">
              {t('Overall risk')}
            </p>
            <p className="t-base font-semibold" style={{ color }}>
              {t('{level} risk', { level: t('risk.' + zone.riskLevel) })} · {zone.riskScore}/100
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <TrendBadge trend={zone.trend} change={zone.crimeCount - zone.previousCount} />
            <span className="t-xs text-[#64748B]">
              {t('vs {count} previous', { count: zone.previousCount })}
            </span>
          </div>
          <p className="flex items-center gap-1 t-sm text-[#64748B]">
            <MapPin className="size-3" aria-hidden />
            {t('{crime} offences trend, peak {peak}', { crime: t('category.' + zone.dominantCrime), peak: zone.peakWindow })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={t('Recent incidents')} value={zone.crimeCount} hint={t('last period {count}', { count: zone.previousCount })} />
        <Stat label={t('Peak period')} value={zone.peakWindow} hint={t('{share}% of incidents', { share: zone.peakShare })} />
        <Stat label={t('Dominant crime')} value={t('category.' + zone.dominantCrime)} hint={t('{share}% share', { share: zone.dominantShare })} />
        <Stat label={t('Repeat within 250 m')} value={`${zone.repeatShare}%`} hint={t('{count} nearby', { count: zone.nearbyCount })} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#D9E2EF]/60 pt-3">
        <p className="flex items-center gap-1 t-xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
          <Activity className="size-3" aria-hidden />
          {t('Recent incidents')}
        </p>
        <span className="flex items-baseline gap-1">
          <span className="t-title font-bold leading-none" style={{ color }}>
            {zone.crimeCount}
          </span>
          <span className="t-xs text-[#64748B]">{t('this period')}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onView}
        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#2676D2] px-3 py-2 t-base font-semibold text-white transition-colors hover:bg-[#2676D2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2676D2]"
      >
        <Radar className="size-4" aria-hidden />
        {t('View on map')}
      </button>
    </article>
  )
}