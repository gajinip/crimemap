import { ChartPie, TrendingUp } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { CategoryStat, MonthPoint } from '../types'
import { CRIME_CATEGORY_COLORS } from '../utils/visuals'
import { Panel } from './ui/Panel'
import { BarRow } from './ui/StatTile'

interface CategoryChartProps {
  data: CategoryStat[]
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { t } = useI18n()
  const max = Math.max(1, ...data.map((item) => item.count))

  return (
    <Panel title={t('Incidents by crime category')} subtitle={t('Distribution across filtered demo set')}>
      <div className="space-y-1.5">
        {data.map((item) => (
          <BarRow
            key={item.category}
            label={t('category.' + item.category)}
            value={item.count}
            max={max}
            color={CRIME_CATEGORY_COLORS[item.category]}
            meta={`${item.share.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-navy-700 pt-2 t-xs text-steel-500">
        <span>{t('Based on synthetic demo data')}</span>
        <ChartPie className="size-4 text-steel-500" aria-hidden />
      </div>
    </Panel>
  )
}

interface TrendsChartProps {
  data: MonthPoint[]
}

export function TrendsChart({ data }: TrendsChartProps) {
  const { t } = useI18n()
  const max = Math.max(1, ...data.map((item) => item.count))

  return (
    <Panel
      title={t('Monthly crime trend')}
      subtitle={t('Rolling by month for selected demo range')}
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
                <div className="mt-1 truncate text-center t-2xs uppercase tracking-[0.14em] text-steel-500">
                  {point.label}
                </div>
              </div>
            )
          })
        ) : (
          <p className="py-6 text-center t-sm text-steel-500">{t('No monthly points in range')}</p>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1 t-xs text-steel-500">
        <TrendingUp className="size-3.5" />
        {t('Comparison values are demo-only approximations.')}
      </div>
    </Panel>
  )
}
