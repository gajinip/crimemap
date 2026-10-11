import { StatisticsPanel } from '../components/StatisticsPanel'
import type { DashboardStats, DateRange, RiskZone } from '../types'

interface DashboardViewProps {
  stats: DashboardStats
  zones: RiskZone[]
  range: DateRange
  compareRange: DateRange | null
  onCompareRangeChange: (range: DateRange | null) => void
}

export function DashboardView({
  stats,
  zones,
  range,
  compareRange,
  onCompareRangeChange,
}: DashboardViewProps) {
  return (
    <div className="flex flex-col gap-3 p-3 pb-6 xl:p-4">
      <StatisticsPanel
        stats={stats}
        zones={zones}
        range={range}
        compareRange={compareRange}
        onCompareRangeChange={onCompareRangeChange}
      />
    </div>
  )
}
