import { Activity, Flame, Gauge, ShieldAlert, TrendingUp, Zap } from 'lucide-react'
import type { DashboardStats, RiskZone } from '../types'
import { formatNumber, formatPercent } from '../utils/format'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS } from '../utils/visuals'
import { DemoChip, RiskBadge, TrendIndicator } from './ui/Badge'
import { Panel } from './ui/Panel'
import { StatTile } from './ui/StatTile'

interface StatisticsPanelProps {
  stats: DashboardStats
  zones: RiskZone[]
  className?: string
}

const TREND_COLORS: Record<DashboardStats['trendDirection'], string> = {
  Rising: '#ef4444',
  Stable: '#eab308',
  Declining: '#22c55e',
}

/** Right-hand information panel with the headline intelligence indicators. */
export function StatisticsPanel({ stats, zones, className = '' }: StatisticsPanelProps) {
  const trendColor = TREND_COLORS[stats.trendDirection]
  const watchlist = [...zones]
    .sort((a, b) => b.riskScore - a.riskScore || b.crimeCount - a.crimeCount)
    .slice(0, 5)

  return (
    <aside
      className={`scroll-thin border-t border-navy-700 bg-navy-900 xl:h-full xl:w-[340px] xl:shrink-0 xl:overflow-y-auto xl:border-l xl:border-t-0 ${className}`}
      aria-label="Situation statistics"
    >
      <div className="flex flex-col gap-3 p-3 xl:p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-steel-300">
            Situation overview
          </h2>
          <DemoChip />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <StatTile
            label="Total incidents"
            value={formatNumber(stats.totalIncidents)}
            hint="Matching active filters"
            color="#60a5fa"
            icon={<Activity className="size-3.5" />}
          />
          <StatTile
            label="Active zones"
            value={stats.activeHotspots}
            hint="Flagged for patrol focus"
            color="#ef4444"
            icon={<Flame className="size-3.5" />}
          />
          <StatTile
            label="Emerging zones"
            value={stats.emergingHotspots}
            hint="New or rising localities"
            color="#f97316"
            icon={<Zap className="size-3.5" />}
          />
          <StatTile
            label="High-risk zones"
            value={stats.highRiskZones}
            hint="High or critical rating"
            color="#eab308"
            icon={<ShieldAlert className="size-3.5" />}
          />
          <StatTile
            label="Avg risk score"
            value={`${stats.averageRiskScore}/100`}
            hint="Mean across visible zones"
            color="#a78bfa"
            icon={<Gauge className="size-3.5" />}
          />
        </div>

        <Panel title="Crime trend" subtitle="Last 30 days vs previous 30 days">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div
                className="text-3xl font-bold leading-none"
                style={{ color: trendColor }}
              >
                {formatPercent(stats.trendPercent, 1)}
              </div>
              <div className="mt-1.5">
                <TrendIndicator trend={stats.trendDirection} showGlyph={false} />
              </div>
            </div>
            <span
              className="grid size-11 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: `${trendColor}1f`, color: trendColor }}
            >
              <TrendingUp
                className={`size-5 ${stats.trendDirection === 'Declining' ? 'rotate-180' : stats.trendDirection === 'Stable' ? 'rotate-90' : ''}`}
                aria-hidden
              />
            </span>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-steel-500">
            Comparison uses synthetic demo incident timestamps inside the selected date range.
          </p>
        </Panel>

        <Panel title="Most common crime type" subtitle="Share of filtered demo incidents">
          {stats.mostCommonCategory ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-white">{stats.mostCommonCategory}</span>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CRIME_CATEGORY_COLORS[stats.mostCommonCategory] }}
                  aria-hidden
                />
              </div>
              <div className="mt-1 text-[11px] text-steel-400">
                {formatNumber(stats.mostCommonCount)} incidents &middot;{' '}
                {stats.totalIncidents > 0
                  ? Math.round((stats.mostCommonCount / stats.totalIncidents) * 100)
                  : 0}
                % of all filtered records
              </div>
            </>
          ) : (
            <p className="text-[11px] text-steel-500">No incidents match the current filters.</p>
          )}
        </Panel>

        <Panel title="Zone watchlist" subtitle="Highest risk score first">
          {watchlist.length > 0 ? (
            <ul className="divide-y divide-navy-700">
              {watchlist.map((zone) => (
                <li key={zone.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: RISK_LEVEL_COLORS[zone.riskLevel] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12px] font-semibold text-steel-100">
                        {zone.area}
                      </span>
                      <RiskBadge level={zone.riskLevel} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-steel-500">
                      <span>{zone.id}</span>
                      <span>&middot;</span>
                      <span>{zone.dominantCrime}</span>
                      <span>&middot;</span>
                      <span>{zone.crimeCount} reports</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className="font-mono text-[13px] font-bold"
                      style={{ color: RISK_LEVEL_COLORS[zone.riskLevel] }}
                    >
                      {zone.riskScore}
                    </span>
                    <div className="mt-0.5">
                      <TrendIndicator trend={zone.trend} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-steel-500">No zones match the current filters.</p>
          )}
        </Panel>

        <p className="pb-1 text-[10px] leading-relaxed text-steel-600">
          All figures derive from synthetic demo records bundled with the app. They are not
          statistics from any police department or government source.
        </p>
      </div>
    </aside>
  )
}
