import { CategoryChart, TrendsChart } from '../components/Charts'
import { WhatChangedPanel } from '../components/WhatChangedPanel'
import { Panel } from '../components/ui/Panel'
import { useI18n } from '../i18n/useI18n'
import type {
  AreaStat,
  CategoryStat,
  ChangeReport,
  DashboardStats,
  MonthPoint,
  RiskLevel,
} from '../types'
import { RISK_LEVEL_COLORS } from '../utils/visuals'

interface TrendsViewProps {
  stats: DashboardStats
  monthly: MonthPoint[]
  categoryStats: CategoryStat[]
  areaStats: AreaStat[]
  statusStats: { status: string; count: number }[]
  zoneRiskCounts: Record<string, number>
  changes: ChangeReport
  onFocusArea: (area: string) => void
}

export function TrendsView({
  monthly,
  categoryStats,
  areaStats,
  statusStats,
  zoneRiskCounts,
  changes,
  onFocusArea,
}: TrendsViewProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3 p-3 pb-6 xl:p-4">
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        <TrendsChart data={monthly} />
        <CategoryChart data={categoryStats} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <Panel title={t('Top areas')} subtitle={t('Filtered demo incidents by locality')}>
          <div className="space-y-1.5">
            {areaStats.map((area) => (
              <div key={area.area} className="flex items-center justify-between gap-3 t-sm">
                <span className="truncate text-steel-200">{area.area}</span>
                <span className="font-mono t-xs text-steel-400">{area.count}</span>
              </div>
            ))}
            {areaStats.length === 0 ? <p className="t-sm text-steel-500">{t('No areas')}</p> : null}
          </div>
        </Panel>
        <Panel title={t('Incident status')} subtitle={t('Resolution mix for filtered demo set')}>
          <div className="space-y-1.5">
            {statusStats.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-3 t-sm">
                <span className="text-steel-200">{t('status.' + item.status)}</span>
                <span className="font-mono t-xs text-steel-400">{item.count}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={t('Risk zone profile')} subtitle={t('Detected zones by risk level')}>
          <div className="space-y-1.5">
            {Object.entries(zoneRiskCounts).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between gap-3 t-sm">
                <span className="inline-flex items-center gap-2 text-steel-200">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: RISK_LEVEL_COLORS[level as RiskLevel] }} />
                  {t('risk.' + level)}
                </span>
                <span className="font-mono t-xs text-steel-400">{count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <WhatChangedPanel report={changes} onFocusArea={onFocusArea} />
    </div>
  )
}