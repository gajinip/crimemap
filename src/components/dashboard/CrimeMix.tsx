import { useMemo } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { CrimeCategory, CrimeIncident, DateRange, TrendDirection } from '../../types'
import { formatDate, formatNumber } from '../../utils/format'
import { withinDateRange } from '../../utils/filters'

interface CrimeDivision {
  id: 'violent' | 'property'
  title: string
  categories: CrimeCategory[]
}

/** The seven crime types split into two report divisions. */
const CRIME_DIVISIONS: CrimeDivision[] = [
  {
    id: 'violent',
    title: 'Reported Puducherry Violent Crime Trends',
    categories: ['Robbery', 'Assault'],
  },
  {
    id: 'property',
    title: 'Reported Puducherry Property Crime Trends',
    categories: ['Theft', 'Burglary', 'Vehicle Theft', 'Fraud', 'Other'],
  },
]

/** Green for decreasing, red for increasing, neutral for flat. */
const TREND_COLOR: Record<TrendDirection, string> = {
  Rising: '#ea4335',
  Declining: '#34a853',
  Stable: '#7b8ba1',
}

const TREND_GLYPH: Record<TrendDirection, string> = {
  Rising: '▲',
  Declining: '▼',
  Stable: '~',
}

interface Trend {
  percent: number | null
  direction: TrendDirection
  hasBaseline: boolean
}

interface PeriodRow {
  category: CrimeCategory
  total: number
  first: number
  second: number
  trend: Trend
}

/** Percentage change from the first half of the period to the second half. */
function trendOf(first: number, second: number): Trend {
  if (first <= 0) return { percent: null, direction: 'Stable', hasBaseline: false }
  const percent = Math.round(((second - first) / first) * 1000) / 10
  const direction: TrendDirection =
    percent > 5 ? 'Rising' : percent < -5 ? 'Declining' : 'Stable'
  return { percent, direction, hasBaseline: true }
}

function trendText({ percent, direction, hasBaseline }: Trend): string {
  if (!hasBaseline || percent === null) return 'n/a'
  if (direction === 'Stable') return `~${Math.abs(percent).toFixed(1)}%`
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
}

/** Counts per category across the period, split into first/second halves. */
function buildRows(
  incidents: CrimeIncident[],
  range: DateRange,
  categories: CrimeCategory[],
): PeriodRow[] {
  const from = new Date(`${range.from}T00:00:00+05:30`).getTime()
  const to = new Date(`${range.to}T23:59:59+05:30`).getTime()
  const mid = from + (to - from) / 2

  return categories.map((category) => {
    const sub = incidents.filter(
      (incident) => incident.category === category && withinDateRange(incident.occurredAt, range),
    )
    const first = sub.filter((incident) => new Date(incident.occurredAt).getTime() < mid).length
    const second = sub.length - first
    return { category, total: sub.length, first, second, trend: trendOf(first, second) }
  })
}

interface CrimeMixProps {
  incidents: CrimeIncident[]
  range: DateRange
}

/** Two report panels summarising violent and property crime trends. */
export function CrimeMix({ incidents, range }: CrimeMixProps) {
  const { t } = useI18n()
  const periodLabel = `${formatDate(range.from)} – ${formatDate(range.to)}`

  const divisions = useMemo(
    () =>
      CRIME_DIVISIONS.map((division) => {
        const rows = buildRows(incidents, range, division.categories).sort(
          (a, b) => b.total - a.total,
        )
        const first = rows.reduce((sum, row) => sum + row.first, 0)
        const second = rows.reduce((sum, row) => sum + row.second, 0)
        const total = rows.reduce((sum, row) => sum + row.total, 0)
        return { division, rows, total, trend: trendOf(first, second) }
      }),
    [incidents, range],
  )

  return (
    <div className="rounded-xl bg-navy-800">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {divisions.map(({ division, rows, total, trend }) => {
          const trendColor = TREND_COLOR[trend.direction]

          return (
            <section key={division.id} className="min-w-0 p-4 sm:p-5">
              <header>
                <h3 className="t-sm font-bold uppercase tracking-[0.14em] text-steel-100">
                  {t(division.title)}
                </h3>
                <p className="mt-1.5 t-md font-bold text-steel-500">{periodLabel}</p>
              </header>

              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div className="min-w-0 shrink-0">
                  {trend.hasBaseline ? (
                    <p className="mt-1.5 flex items-center gap-2">
                      <span
                        className="font-mono text-[48px] font-bold leading-none tabular-nums sm:text-[56px] xl:text-[64px]"
                        style={{ color: trendColor }}
                      >
                        {trendText(trend)}
                      </span>
                      <span
                        className="text-xl leading-none sm:text-2xl"
                        style={{ color: trendColor }}
                        aria-hidden
                      >
                        {TREND_GLYPH[trend.direction]}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1.5 font-mono text-[48px] font-bold leading-none text-steel-400 sm:text-[56px] xl:text-[64px]">
                      {t('n/a')}
                    </p>
                  )}
                  <p className="mt-2 t-xs text-steel-400">
                    {t('{count} incidents in the period', { count: formatNumber(total) })}
                  </p>
                </div>

                <ul className="crime-category-grid min-w-0 flex-1">
                  {rows.map((row) => (
                    <li key={row.category} className="crime-category-item">
                      <span className="t-xl font-semibold text-steel-200">
                        {t('category.' + row.category)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 t-lg font-semibold tabular-nums"
                        style={{ color: TREND_COLOR[row.trend.direction] }}
                      >
                        {row.trend.hasBaseline ? (
                          <>
                            <span>{trendText(row.trend)}</span>
                            <span aria-hidden>{TREND_GLYPH[row.trend.direction]}</span>
                          </>
                        ) : (
                          <span className="text-steel-400">{t('n/a')}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
