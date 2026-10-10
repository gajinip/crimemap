import type { ReactNode } from 'react'
import type { ComparePeriod, DashboardStats, RiskZone, TrendDirection } from '../types'
import { formatNumber, formatPercent } from '../utils/format'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS } from '../utils/visuals'
import { DemoChip, RiskBadge, TrendIndicator } from './ui/Badge'

interface StatisticsPanelProps {
  stats: DashboardStats
  zones: RiskZone[]
  comparePeriod: ComparePeriod
  onComparePeriodChange: (period: ComparePeriod) => void
  className?: string
}

const PERIODS: ComparePeriod[] = ['Day', 'Week', 'Month', 'Year']

const TREND_COLORS: Record<DashboardStats['trendDirection'], string> = {
  Rising: '#ef4444',
  Stable: '#eab308',
  Declining: '#22c55e',
}

/** Compact table. Sparkline placeholder: "▲ +12% / ▼ -8% / ~0%". */
function DeltaBadge({
  percent,
  direction,
  className = '',
}: {
  percent: number
  direction: TrendDirection
  className?: string
}) {
  if (direction === 'Stable') {
    return (
      <span className={`font-mono text-[13px] font-bold text-steel-400 ${className}`}>
        ~{Math.abs(percent)}%
      </span>
    )
  }
  const rising = direction === 'Rising'
  return (
    <span
      className={`font-mono text-[13px] font-bold ${className}`}
      style={{ color: rising ? '#ef4444' : '#22c55e' }}
    >
      {rising ? '▲' : '▼'} {Math.abs(percent)}%
    </span>
  )
}

/** Minimal "label — count" situation cell (no border or background). */
function OverviewRow({
  label,
  value,
  trend,
  className = '',
}: {
  label: string
  value: ReactNode
  trend?: { percent: number; direction: TrendDirection }
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-0.5 py-0.5 ${className}`}>
      <span className="text-[15px] font-bold uppercase tracking-[0.12em] text-steel-400">
        {label}
      </span>
      <span className="font-mono text-[25px] font-bold leading-none text-white">{value}</span>
      {trend ? <DeltaBadge percent={trend.percent} direction={trend.direction} /> : null}
    </div>
  )
}

/** Uppercase section heading sharing the Panel title styling. */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h2 className="text-[18px] font-bold uppercase tracking-[0.14em] text-steel-300">
        {title}
      </h2>
      {subtitle ? <p className="mt-0.5 text-[16px] text-steel-500">{subtitle}</p> : null}
    </>
  )
}

/** Right-hand information panel with the headline intelligence indicators. */
export function StatisticsPanel({
  stats,
  zones,
  comparePeriod,
  onComparePeriodChange,
  className = '',
}: StatisticsPanelProps) {
  const trendColor = TREND_COLORS[stats.trendDirection]
  const watchlist = [...zones]
    .sort((a, b) => b.riskScore - a.riskScore || b.crimeCount - a.crimeCount)
    .slice(0, 5)

  return (
    <aside
      className={`bg-navy-900 sticky top-0 self-start xl:w-[340px] xl:shrink-0 ${className}`}
      aria-label="Situation statistics"
    >
      <div className="flex flex-col p-3 xl:p-4">
        <header className="flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-bold uppercase tracking-[0.14em] text-steel-300">
            Situation overview
          </h2>
          <DemoChip />
        </header>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-steel-500">
            vs previous
          </span>
          <div className="flex gap-1">
            {PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => onComparePeriodChange(period)}
                aria-pressed={period === comparePeriod}
                className={`rounded-full px-2.5 py-1 text-[12px] font-bold transition-colors ${
                  period === comparePeriod
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-800 text-steel-300 hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <OverviewRow
            label="Total incidents"
            value={formatNumber(stats.totalIncidents)}
            trend={stats.compare}
          />
          <OverviewRow label="Active zones" value={stats.activeHotspots} />
          <OverviewRow label="Emerging zones" value={stats.emergingHotspots} />
          <OverviewRow label="High-risk zones" value={stats.highRiskZones} />
          <OverviewRow
            label="Avg risk score"
            value={`${stats.averageRiskScore}/100`}
            className="col-span-2"
          />
        </div>

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SectionTitle
                title="Crime trend"
                subtitle="Last 30 days vs previous 30 days"
              />
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="text-[25px] font-bold leading-none"
                  style={{ color: trendColor }}
                >
                  {formatPercent(stats.trendPercent, 1)}
                </span>
                <TrendIndicator trend={stats.trendDirection} glyphOnly />
              </span>
            </div>
          </div>
        </section>

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SectionTitle
                title="Most common crime type"
                subtitle="Share of filtered demo incidents"
              />
            </div>
            {stats.mostCommonCategory ? (
              <div className="shrink-0 text-right">
                <span className="flex items-center justify-end gap-1.5 text-[21px] font-bold text-white">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: CRIME_CATEGORY_COLORS[stats.mostCommonCategory] }}
                    aria-hidden
                  />
                  {stats.mostCommonCategory}
                </span>
                <div className="mt-1 text-[17px] text-steel-400">
                  {formatNumber(stats.mostCommonCount)} incidents &middot;{' '}
                  {stats.totalIncidents > 0
                    ? Math.round((stats.mostCommonCount / stats.totalIncidents) * 100)
                    : 0}
                  % <DeltaBadge percent={stats.compare.percent} direction={stats.compare.direction} />
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-steel-500">
                No incidents match the current filters.
              </p>
            )}
          </div>
        </section>

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <SectionTitle title="Zone watchlist" subtitle="Highest risk score first" />
          {watchlist.length > 0 ? (
            <ul className="mt-2 divide-y divide-navy-700">
              {watchlist.map((zone) => (
                <li key={zone.id} className="flex items-center gap-3 py-1 first:pt-0 last:pb-0">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: RISK_LEVEL_COLORS[zone.riskLevel] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[18px] font-semibold text-steel-100">
                        {zone.area}
                      </span>
                      <RiskBadge level={zone.riskLevel} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[16px] text-steel-500">
                      <span>{zone.id}</span>
                      <span>&middot;</span>
                      <span>{zone.dominantCrime}</span>
                      <span>&middot;</span>
                      <span>{zone.crimeCount} reports</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <span
                        className="font-mono text-[27px] font-bold"
                        style={{ color: RISK_LEVEL_COLORS[zone.riskLevel] }}
                      >
                        {zone.riskScore}
                      </span>
                      <TrendIndicator trend={zone.trend} glyphOnly />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[11px] text-steel-500">No zones match the current filters.</p>
          )}
        </section>

        <p className="mt-2.5 border-t border-navy-700 pt-2.5 text-[12px] leading-relaxed text-steel-600">
          All figures derive from synthetic demo records bundled with the app. They are not
          statistics from any police department or government source.
        </p>
      </div>
    </aside>
  )
}