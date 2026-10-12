import { useMemo } from 'react'
import { StatisticsPanel } from '../components/StatisticsPanel'
import { CrimeLinkPanel } from '../components/dashboard/CrimeLinkPanel'
import { CrimeMix } from '../components/dashboard/CrimeMix'
import { DateFilterBar } from '../components/dashboard/DateFilterBar'
import { KpiRow } from '../components/dashboard/KpiRow'
import { MostWantedPanel } from '../components/dashboard/MostWantedPanel'
import { RecentPanel } from '../components/dashboard/RecentPanel'
import type { CategoryTrend } from '../utils/stats'
import { buildCategoryStats, buildMonthlySeries, computeDashboardStats } from '../utils/stats'
import type {
  AnalysisWindow,
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
  /** Recent/previous windows, used to flag past-vs-present crime links. */
  window: AnalysisWindow
}

/**
 * Situation dashboard.
 *
 * A date filter bar and the headline KPI row sit above the crime mix, which
 * spans the full width. The Day/Range control is a KPI-only filter: the `stats`
 * prop already reflects the selected window and drives the headline indicators,
 * while every other panel is computed from the full default-period dataset so
 * the report trends and insights stay period-complete.
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
  window,
}: DashboardViewProps) {
  const fullStats = useMemo(
    () => computeDashboardStats(incidents, zones, null, range, incidents),
    [incidents, zones, range],
  )
  const categoryStats = useMemo(() => buildCategoryStats(incidents), [incidents])
  const monthly = useMemo(() => buildMonthlySeries(incidents, range), [incidents, range])
  const recent = useMemo(
    () =>
      [...incidents]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, 6),
    [incidents],
  )

  return (
    <div className="flex w-full flex-col gap-4 p-3 pb-6 xl:p-4">
      <DateFilterBar
        range={range}
        compareRange={compareRange}
        onCompareRangeChange={onCompareRangeChange}
      />

      <CrimeMix incidents={incidents} range={range} />

      <KpiRow stats={stats} zones={zones} stationCount={stations.length} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <StatisticsPanel
          stats={fullStats}
          zones={zones}
          className="rounded-xl border border-navy-700 bg-navy-850"
        />
        <RecentPanel
          recent={recent}
          total={incidents.length}
          categoryStats={categoryStats}
          zones={zones}
          monthly={monthly}
          categoryTrends={categoryTrends}
          rollingTrend
        />
      </div>

      <MostWantedPanel />

      <CrimeLinkPanel incidents={incidents} window={window} />
    </div>
  )
}
