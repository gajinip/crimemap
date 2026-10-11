import { useMemo } from 'react'
import { StatisticsPanel } from '../components/StatisticsPanel'
import { KpiRow } from '../components/dashboard/KpiRow'
import { RecentPanel } from '../components/dashboard/RecentPanel'
import type { CategoryTrend } from '../utils/stats'
import { buildCategoryStats, buildMonthlySeries } from '../utils/stats'
import { withinDateRange } from '../utils/filters'
import type {
  CrimeIncident,
  DashboardStats,
  DateRange,
  PoliceStation,
  RiskZone,
} from '../types'

interface DashboardViewProps {
  stats: DashboardStats
  zones: RiskZone[]
  range: DateRange
  compareRange: DateRange | null
  onCompareRangeChange: (range: DateRange | null) => void
  categoryTrends: CategoryTrend[]
  incidents: CrimeIncident[]
  stations: PoliceStation[]
}

/**
 * Situation dashboard.
 *
 * A headline KPI row sits above a two-column analytical band: the
 * "Situation overview" rail on the left and the latest records plus derived
 * insights on the right. Every panel is fed from the same window-scoped dataset
 * so the numbers reconcile across the page.
 */
export function DashboardView({
  stats,
  zones,
  range,
  compareRange,
  onCompareRangeChange,
  categoryTrends,
  incidents,
  stations,
}: DashboardViewProps) {
  const windowIncidents = useMemo(
    () =>
      compareRange
        ? incidents.filter((incident) => withinDateRange(incident.occurredAt, compareRange))
        : incidents,
    [incidents, compareRange],
  )

  const categoryStats = useMemo(() => buildCategoryStats(windowIncidents), [windowIncidents])
  const monthly = useMemo(
    () => buildMonthlySeries(windowIncidents, compareRange ?? range),
    [windowIncidents, compareRange, range],
  )
  const recent = useMemo(
    () =>
      [...windowIncidents]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, 6),
    [windowIncidents],
  )

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 p-3 pb-6 xl:p-4">
      <KpiRow stats={stats} zones={zones} stationCount={stations.length} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <StatisticsPanel
          stats={stats}
          zones={zones}
          range={range}
          compareRange={compareRange}
          onCompareRangeChange={onCompareRangeChange}
          categoryTrends={categoryTrends}
          className="rounded-xl border border-navy-700 bg-navy-850"
        />
        <RecentPanel
          recent={recent}
          total={windowIncidents.length}
          categoryStats={categoryStats}
          zones={zones}
          monthly={monthly}
          categoryTrends={categoryTrends}
          rollingTrend={compareRange === null}
        />
      </div>
    </div>
  )
}
