import { ChartPie, TrendingUp } from 'lucide-react'
import type { CategoryStat, MonthPoint } from '../types'
import { CRIME_CATEGORY_COLORS } from '../utils/visuals'
import { Panel } from './ui/Panel'
import { BarRow } from './ui/StatTile'
import { DemoChip } from './ui/Badge'

interface CategoryChartProps {
  data: CategoryStat[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  const max = Math.max(1, ...data.map((item) => item.count))

  return (
    <Panel title="Incidents by crime category" subtitle="Distribution across filtered demo set">
      <div className="space-y-1.5">
        {data.map((item) => (
          <BarRow
            key={item.category}
            label={item.category}
            value={item.count}
            max={max}
            color={CRIME_CATEGORY_COLORS[item.category]}
            meta={`${item.share.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-navy-700 pt-2 text-[10px] text-steel-500">
        <span>Based on synthetic demo data</span>
        <ChartPie className="size-4 text-steel-500" aria-hidden />
      </div>
    </Panel>
  )
}

interface TrendsChartProps {
  data: MonthPoint[]
}

export function TrendsChart({ data }: TrendsChartProps) {
  const max = Math.max(1, ...data.map((item) => item.count))

  return (
    <Panel
      title="Monthly crime trend"
      subtitle="Rolling by month for selected demo range"
      actions={<DemoChip compact />}
    >
      <div className="flex items-end gap-1.5">
        {data.length > 0 ? (
          data.map((point) => {
            const height = max > 0 ? (point.count / max) * 100 : 0
            return (
              <div key={point.month} className="flex-1">
                <div className="flex h-24 items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-blue-600 to-sky-400/90"
                    style={{ height: `${Math.max(height, 3)}%` }}
                    title={`${point.label}: ${point.count}`}
                  />
                </div>
                <div className="mt-1 truncate text-center text-[9px] uppercase tracking-[0.14em] text-steel-500">
                  {point.label}
                </div>
              </div>
            )
          })
        ) : (
          <p className="py-6 text-center text-[11px] text-steel-500">No monthly points in range</p>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-steel-500">
        <TrendingUp className="size-3.5" />
        Comparison values are demo-only approximations.
      </div>
    </Panel>
  )
}
