import { CategoryChart, TrendsChart } from '../components/Charts'
import { Panel } from '../components/ui/Panel'
import { DemoChip } from '../components/ui/Badge'
import type { AreaStat, CategoryStat, DashboardStats, MonthPoint, RiskLevel } from '../types'
import { RISK_LEVEL_COLORS } from '../utils/visuals'

interface TrendsViewProps {
  stats: DashboardStats
  monthly: MonthPoint[]
  categoryStats: CategoryStat[]
  areaStats: AreaStat[]
  statusStats: { status: string; count: number }[]
  zoneRiskCounts: Record<string, number>
}

export function TrendsView({ monthly, categoryStats, areaStats, statusStats, zoneRiskCounts }: TrendsViewProps) {
  return (
    <div className="flex flex-col gap-3 p-3 pb-6 xl:p-4">
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        <TrendsChart data={monthly} />
        <CategoryChart data={categoryStats} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <Panel title="Top areas" subtitle="Filtered demo incidents by locality">
          <div className="space-y-1.5">
            {areaStats.map((area) => (
              <div key={area.area} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="truncate text-steel-200">{area.area}</span>
                <span className="font-mono text-[10px] text-steel-400">{area.count}</span>
              </div>
            ))}
            {areaStats.length === 0 ? <p className="text-[11px] text-steel-500">No areas</p> : null}
          </div>
        </Panel>
        <Panel title="Incident status" subtitle="Resolution mix for filtered demo set">
          <div className="space-y-1.5">
            {statusStats.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-steel-200">{item.status}</span>
                <span className="font-mono text-[10px] text-steel-400">{item.count}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Risk zone profile" subtitle="Detected zones by risk level">
          <div className="space-y-1.5">
            {Object.entries(zoneRiskCounts).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="inline-flex items-center gap-2 text-steel-200">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: RISK_LEVEL_COLORS[level as RiskLevel] }} />
                  {level}
                </span>
                <span className="font-mono text-[10px] text-steel-400">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-steel-500">
            <DemoChip compact />
          </div>
        </Panel>
      </div>
    </div>
  )
}

