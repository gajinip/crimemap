import { StatisticsPanel } from '../components/StatisticsPanel'
import type { ComparePeriod, DashboardStats, RiskZone } from '../types'

interface DashboardViewProps {
  stats: DashboardStats
  zones: RiskZone[]
  comparePeriod: ComparePeriod
  onComparePeriodChange: (period: ComparePeriod) => void
}

export function DashboardView({
  stats,
  zones,
  comparePeriod,
  onComparePeriodChange,
}: DashboardViewProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden overscroll-none bg-navy-950 p-3 pb-6 xl:p-4">
      <StatisticsPanel
        stats={stats}
        zones={zones}
        comparePeriod={comparePeriod}
        onComparePeriodChange={onComparePeriodChange}
      />
    </div>
  )
}
