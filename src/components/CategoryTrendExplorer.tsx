import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { CategoryStat, CrimeCategory, CrimeIncident, DateRange } from '../types'
import { buildCategoryDetail } from '../utils/categoryInsights'
import { formatNumber, formatPercent } from '../utils/format'
import { ChartCard } from './charts/ChartCard'

interface CategoryTrendExplorerProps {
  /** Per-category totals and shares for the current period. */
  categoryStats: CategoryStat[]
  /** Filtered incidents used to derive the selected category's detail. */
  incidents: CrimeIncident[]
  range: DateRange
  /** Opens the full analytical breakdown drawer for a category. */
  onOpenDetails: (category: CrimeCategory) => void
}

/** Labelled metric used inside the selected category's stat grid. */
function Spot({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-navy-700 bg-navy-800/50 px-3 py-2">
      <p className="truncate t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">{label}</p>
      <p className="mt-0.5 truncate t-base font-semibold text-steel-100">{value}</p>
    </div>
  )
}

/**
 * Crime-category explorer for the Trends page.
 *
 * A swipeable row of category tabs sits above a panel that swaps to the
 * selected category's headline statistics and plain-language period-change
 * statements (UCR-style "increased/decreased an estimated N percent"). The full
 * multi-section analysis remains available in the right drawer via
 * "Open full details".
 */
export function CategoryTrendExplorer({
  categoryStats,
  incidents,
  range,
  onOpenDetails,
}: CategoryTrendExplorerProps) {
  const { t } = useI18n()
  // Highest-volume category first, matching the order users read the list.
  const categories = useMemo(
    () => [...categoryStats].sort((a, b) => b.count - a.count),
    [categoryStats],
  )
  // Null means "follow the top category"; explicit selection wins when valid.
  const [selected, setSelected] = useState<CrimeCategory | null>(null)
  const active =
    selected && categories.some((entry) => entry.category === selected)
      ? selected
      : categories[0]?.category ?? null

  const detail = useMemo(
    () => (active ? buildCategoryDetail(incidents, active, range) : null),
    [incidents, active, range],
  )

  return (
    <ChartCard title="Incidents by crime category" subtitle="Share of reported incidents">
      {/* Swipeable category tabs (horizontal scroll with snap on touch). */}
      <div
        role="tablist"
        aria-label={t('Crime categories')}
        className="scroll-thin -mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1"
      >
        {categories.map(({ category, count }) => {
          const isActive = category === active
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelected(category)}
              className={`inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 t-xs font-semibold transition-colors ${
                isActive
                  ? 'border-blue-500/60 bg-navy-800 text-steel-100'
                  : 'border-navy-700 text-steel-400 hover:border-navy-500 hover:text-steel-100'
              }`}
            >
              {t('category.' + category)}
              <span className={`font-mono tabular-nums ${isActive ? 'text-steel-300' : 'text-steel-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {detail && active ? (
        <CategoryDetailPanel
          detail={detail}
          categoryLabel={t('category.' + active)}
          onOpenDetails={() => onOpenDetails(active)}
        />
      ) : (
        <p className="py-4 text-center t-sm text-steel-500">{t('No data in this period.')}</p>
      )}
    </ChartCard>
  )
}

interface CategoryDetailPanelProps {
  detail: ReturnType<typeof buildCategoryDetail>
  categoryLabel: string
  onOpenDetails: () => void
}

/** Statistics and period-change statements for the selected category. */
function CategoryDetailPanel({
  detail,
  categoryLabel,
  onOpenDetails,
}: CategoryDetailPanelProps) {
  const { t } = useI18n()

  const changeValue =
    detail.hasBaseline && detail.changePercent !== null
      ? formatPercent(detail.changePercent, 1)
      : t('No baseline')

  // Plain-language findings, led by the estimated period change (UCR style).
  const statements: string[] = []
  if (detail.hasBaseline && detail.changePercent !== null) {
    if (detail.changePercent === 0) {
      statements.push(
        t('{category} incidents held steady versus the previous period.', { category: categoryLabel }),
      )
    } else {
      statements.push(
        t('{category} incidents {verb} an estimated {change} percent versus the previous period.', {
          category: categoryLabel,
          verb: t(detail.changePercent > 0 ? 'increased' : 'decreased'),
          change: Math.abs(detail.changePercent).toFixed(1),
        }),
      )
    }
  } else {
    statements.push(
      t('Not enough history to estimate a period change for {category}.', { category: categoryLabel }),
    )
  }
  if (detail.topArea) {
    statements.push(
      t('{area} recorded the most incidents ({count}, {share}% of the category).', {
        area: detail.topArea.name,
        count: detail.topArea.count,
        share: detail.topArea.share,
      }),
    )
  }
  if (detail.peakDay) {
    statements.push(
      t('Activity peaked on {day} with {count} incidents.', {
        day: detail.peakDay.label,
        count: detail.peakDay.count,
      }),
    )
  }
  if (detail.peakHour) {
    statements.push(
      t('The busiest window was {window} with {count} incidents.', {
        window: detail.peakHour.label,
        count: detail.peakHour.count,
      }),
    )
  }
  if (detail.pending > 0) {
    statements.push(t('{count} cases remain open for investigation.', { count: detail.pending }))
  }

  return (
    <div className="mt-3 rounded-xl border border-navy-700 bg-navy-900/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate t-md font-semibold text-steel-100">{categoryLabel}</h3>
        </div>
        <span className="t-xs text-steel-500">
          {formatNumber(detail.total)} {t('incidents')} · {detail.overallShare}% {t('of all')}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Spot label={t('Total incidents')} value={formatNumber(detail.total)} />
        <Spot label={t('Share of all incidents')} value={`${detail.overallShare}%`} />
        <Spot label={t('Change vs previous')} value={changeValue} />
        <Spot
          label={t('Top locality')}
          value={detail.topArea ? `${detail.topArea.name} · ${detail.topArea.count}` : t('n/a')}
        />
        <Spot
          label={t('Peak day')}
          value={detail.peakDay ? `${detail.peakDay.label} · ${detail.peakDay.count}` : t('n/a')}
        />
        <Spot
          label={t('Peak window')}
          value={detail.peakHour ? `${detail.peakHour.label} · ${detail.peakHour.count}` : t('n/a')}
        />
      </div>

      <ul className="mt-3 space-y-1.5 t-sm text-steel-300">
        {statements.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onOpenDetails}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 t-xs font-semibold text-steel-200 transition-colors hover:border-blue-500 hover:text-steel-100"
      >
        {t('Open full details')}
        <ArrowUpRight className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
