import { useMemo, useState } from 'react'
import { CategoryTrendExplorer } from '../components/CategoryTrendExplorer'
import { CrimeCategoryDetails } from '../components/CrimeCategoryDetails'
import { GroupedBarChart } from '../components/charts/GroupedBarChart'
import type { SeriesDef } from '../components/charts/GroupedBarChart'
import { WhatChangedPanel } from '../components/WhatChangedPanel'
import { Panel } from '../components/ui/Panel'
import { useI18n } from '../i18n/useI18n'
import type {
  AreaStat,
  CategoryStat,
  ChangeReport,
  CrimeCategory,
  CrimeIncident,
  DashboardStats,
  DateRange,
  RiskLevel,
} from '../types'
import { buildCategoryHalfComparison } from '../utils/chartData'
import { formatDate } from '../utils/format'
import { RISK_LEVEL_COLORS } from '../utils/visuals'

// Series for the grouped comparison chart: current half in solid indigo,
// previous half in a lighter lavender.
const CATEGORY_COMPARISON_SERIES: SeriesDef[] = [
  { key: 'current', label: 'Current period', color: '#2676D2' },
  { key: 'previous', label: 'Previous period', color: '#16A085' },
]

interface TrendsViewProps {
  stats: DashboardStats
  categoryStats: CategoryStat[]
  areaStats: AreaStat[]
  statusStats: { status: string; count: number }[]
  zoneRiskCounts: Record<string, number>
  changes: ChangeReport
  incidents: CrimeIncident[]
  range: DateRange
  onFocusArea: (area: string) => void
}

export function TrendsView({
  categoryStats,
  areaStats,
  statusStats,
  zoneRiskCounts,
  changes,
  incidents,
  range,
  onFocusArea,
}: TrendsViewProps) {
  const { t } = useI18n()
  // Category whose full analytical breakdown is open in the detail sheet.
  const [detailCategory, setDetailCategory] = useState<CrimeCategory | null>(null)

  // Reshape the per-category half comparison into the grouped chart's expected
  // { seriesKey -> value } form, translating category keys for display.
  const categoryComparison = useMemo(
    () =>
      buildCategoryHalfComparison(incidents, range).map((row) => ({
        key: row.category,
        label: t('category.' + row.category),
        values: { current: row.second, previous: row.first },
        changePercent: row.changePercent,
        hasBaseline: row.hasBaseline,
      })),
    [incidents, range, t],
  )
  // Subtitle states the exact reporting period and what is being compared.
  const comparisonSubtitle = `${formatDate(range.from)} – ${formatDate(range.to)} · ${t(
    'first vs second half',
  )}`

  return (
    <div className="flex flex-col gap-3 p-3 pb-6 xl:p-4">
      {/* Full-width interactive comparison of each category's two halves. */}
      <GroupedBarChart
        title="Crime incidents by category"
        subtitle={comparisonSubtitle}
        series={CATEGORY_COMPARISON_SERIES}
        data={categoryComparison}
      />
      <CategoryTrendExplorer
        categoryStats={categoryStats}
        incidents={incidents}
        range={range}
        onOpenDetails={setDetailCategory}
      />
      <p className="t-xs text-steel-500">
        {t('Figures are approximate — demo data only.')}
      </p>
      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <Panel title={t('Top areas')} subtitle={t('Incidents reported by locality')}>
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
        <Panel title={t('Incident status')} subtitle={t('Share of incidents by status')}>
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
      {/* Full category breakdown, opened from the category nav. */}
      {detailCategory ? (
        <CrimeCategoryDetails
          category={detailCategory}
          incidents={incidents}
          range={range}
          onClose={() => setDetailCategory(null)}
        />
      ) : null}
    </div>
  )
}