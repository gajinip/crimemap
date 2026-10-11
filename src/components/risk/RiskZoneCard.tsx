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
import type { RiskLevel, RiskZone, TrendDirection } from '../../types'
import {
  RISK_LEVEL_BADGE,
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL,
  TREND_COLOR,
} from '../../utils/riskPalette'
import { RiskScoreRing } from './RiskScoreRing'

const LEVEL_ICON: Record<RiskLevel, ReactNode> = {
  Critical: <Flame className="size-3.5" aria-hidden />,
  High: <Flame className="size-3.5" aria-hidden />,
  Medium: <Gauge className="size-3.5" aria-hidden />,
  Low: <ShieldCheck className="size-3.5" aria-hidden />,
}

function TrendBadge({ trend, change }: { trend: TrendDirection; change: number }) {
  const color = TREND_COLOR[trend]
  const Icon =
    trend === 'Rising' ? TrendingUp : trend === 'Declining' ? TrendingDown : Minus
  const text = `${change > 0 ? '+' : ''}${change} incidents`
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold"
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
    <div className="min-w-0 rounded-lg border border-[#DCE4EE]/60 bg-[#F4F7FB]/70 px-2.5 py-2">
      <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#53647A]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-[#14233B]">{value}</p>
      {hint ? <p className="truncate text-[10px] text-[#53647A]">{hint}</p> : null}
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
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color, backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
        >
          {LEVEL_ICON[zone.riskLevel]}
          {RISK_LEVEL_BADGE[zone.riskLevel]} risk
        </span>
        <span className="shrink-0 rounded-md border border-[#DCE4EE] bg-[#F4F7FB] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#53647A]">
          {zone.id}
        </span>
      </header>

      <button
        type="button"
        onClick={onSelect}
        className="block min-w-0 text-left"
        aria-label={`View details for ${zone.area} (${RISK_LEVEL_LABEL[zone.riskLevel]}, score ${zone.riskScore})`}
      >
        <h3
          id={`zone-title-${zone.id}`}
          className="break-words text-[17px] font-semibold leading-snug text-[#14233B]"
        >
          {zone.area}
        </h3>
        <p className="mt-0.5 text-[11px] text-[#53647A]">
          {zone.status} · {zone.crimeCount} recent incidents
        </p>
      </button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <RiskScoreRing score={zone.riskScore} level={zone.riskLevel} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#53647A]">
              Overall risk
            </p>
            <p className="text-[13px] font-semibold" style={{ color }}>
              {RISK_LEVEL_LABEL[zone.riskLevel]} · {zone.riskScore}/100
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <TrendBadge trend={zone.trend} change={zone.crimeCount - zone.previousCount} />
            <span className="text-[10px] text-[#53647A]">
              vs {zone.previousCount} previous
            </span>
          </div>
          <p className="flex items-center gap-1 text-[11px] text-[#53647A]">
            <MapPin className="size-3" aria-hidden />
            {zone.dominantCrime} offences trend, peak {zone.peakWindow}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Recent incidents" value={zone.crimeCount} hint={`last period ${zone.previousCount}`} />
        <Stat label="Peak period" value={zone.peakWindow} hint={`${zone.peakShare}% of incidents`} />
        <Stat label="Dominant crime" value={zone.dominantCrime} hint={`${zone.dominantShare}% share`} />
        <Stat label="Repeat within 250 m" value={`${zone.repeatShare}%`} hint={`${zone.nearbyCount} nearby`} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#DCE4EE]/60 pt-3">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#53647A]">
          <Activity className="size-3" aria-hidden />
          Recent incidents
        </p>
        <span className="flex items-baseline gap-1">
          <span className="text-[20px] font-bold leading-none" style={{ color }}>
            {zone.crimeCount}
          </span>
          <span className="text-[10px] text-[#53647A]">this period</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onView}
        className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1A73E8] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4285F4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A73E8]"
      >
        <Radar className="size-4" aria-hidden />
        View on map
      </button>
    </article>
  )
}