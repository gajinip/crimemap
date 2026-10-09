import { StatisticsPanel } from '../components/StatisticsPanel'
import type { DashboardStats, RiskZone } from '../types'

interface DashboardViewProps {
  stats: DashboardStats
  zones: RiskZone[]
}

export function DashboardView({ stats, zones }: DashboardViewProps) {
  return (
    <div className="scroll-thin flex h-full flex-col gap-3 overflow-y-auto bg-navy-950 p-3 pb-6 xl:p-4">
      <StatisticsPanel stats={stats} zones={zones} />
    </div>
  )
}
