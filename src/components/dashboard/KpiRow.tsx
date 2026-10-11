import { Gauge, Landmark, ShieldAlert, Siren } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'
import type { ReactNode } from 'react'
import type { DashboardStats, RiskZone } from '../../types'
import { formatNumber } from '../../utils/format'
import { DeltaBadge } from '../ui/Badge'

interface KpiCardProps {
  label: string
  icon: ReactNode
  value: ReactNode
  hint?: string
  trend?: { percent: number; direction: DashboardStats['compare']['direction']; hasBaseline: boolean }
}

/**
 * Headline metric card. Uses a fixed top-down stack (icon + label, then value,
 * then context) so the large figures align on a shared baseline across the row
 * regardless of whether a card carries a comparison or a hint.
 */
function KpiCard({ label, icon, value, hint, trend }: KpiCardProps) {
  const { t } = useI18n()
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 text-steel-500" aria-hidden>
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate t-xs font-bold uppercase tracking-[0.12em] text-steel-400">
          {t(label)}
        </span>
      </div>
      <div className="flex min-w-0 items-end justify-between gap-2">
        <span className="font-mono t-metric font-bold leading-none text-steel-100">{value}</span>
        {trend && trend.hasBaseline ? (
          <DeltaBadge percent={trend.percent} direction={trend.direction} />
        ) : null}
      </div>
      {hint ? <span className="t-xs leading-tight text-steel-500">{hint}</span> : null}
    </div>
  )
}

interface KpiRowProps {
  stats: DashboardStats
  zones: RiskZone[]
  stationCount: number
}

/** The dashboard's four headline indicators, computed only from real data. */
export function KpiRow({ stats, zones, stationCount }: KpiRowProps) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total incidents"
        icon={<Siren className="size-3.5" />}
        value={formatNumber(stats.totalIncidents)}
        trend={stats.compare}
      />
      <KpiCard
        label="High-risk zones"
        icon={<ShieldAlert className="size-3.5" />}
        value={formatNumber(stats.highRiskZones)}
        hint={t('of {n} detected zones', { n: formatNumber(zones.length) })}
      />
      <KpiCard
        label="Average risk score"
        icon={<Gauge className="size-3.5" />}
        value={`${stats.averageRiskScore}/100`}
        hint={t('weighted across active zones')}
      />
      <KpiCard
        label="Police stations"
        icon={<Landmark className="size-3.5" />}
        value={formatNumber(stationCount)}
        hint="jurisdictions over Puducherry areas"
      />
    </div>
  )
}
