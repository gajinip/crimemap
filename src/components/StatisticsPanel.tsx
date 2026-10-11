import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { CategoryTrend } from '../utils/stats'
import type { CrimeCategory, DashboardStats, DateRange, RiskZone, TrendDirection } from '../types'
import { formatNumber, formatPercent } from '../utils/format'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS, trendGlyph } from '../utils/visuals'
import { DeltaBadge, RiskBadge, TrendIndicator } from './ui/Badge'
import { InfoPopover } from './ui/InfoPopover'

interface StatisticsPanelProps {
  stats: DashboardStats
  zones: RiskZone[]
  range: DateRange
  compareRange: DateRange | null
  onCompareRangeChange: (range: DateRange | null) => void
  categoryTrends: CategoryTrend[]
  className?: string
}

const TREND_COLORS: Record<DashboardStats['trendDirection'], string> = {
  Rising: '#ef4444',
  Stable: '#eab308',
  Declining: '#22c55e',
}

interface CrimeDivision {
  id: 'property' | 'violent'
  label: string
  description: string
  accent: string
  categories: CrimeCategory[]
}

/** The seven crime types split into two divisions for the dashboard mix. */
const CRIME_DIVISIONS: CrimeDivision[] = [
  {
    id: 'property',
    label: 'Property & economic',
    description: 'Theft, burglary, vehicle theft, fraud and other',
    accent: '#1a73e8',
    categories: ['Theft', 'Burglary', 'Vehicle Theft', 'Fraud', 'Other'],
  },
  {
    id: 'violent',
    label: 'Violent & person',
    description: 'Robbery and assault',
    accent: '#ea4335',
    categories: ['Robbery', 'Assault'],
  },
]

function divisionTrend(
  rows: CategoryTrend[],
): { percent: number | null; direction: TrendDirection; hasBaseline: boolean } {
  const current = rows.reduce((sum, row) => sum + row.current, 0)
  const previous = rows.reduce((sum, row) => sum + row.previous, 0)
  if (previous <= 0) {
    return {
      percent: null,
      direction: 'Stable',
      hasBaseline: false,
    }
  }
  const percent = Math.round(((current - previous) / previous) * 10) / 10
  const direction: TrendDirection =
    percent > 5 ? 'Rising' : percent < -5 ? 'Declining' : 'Stable'
  return { percent, direction, hasBaseline: true }
}

function ChangePct({
  percent,
  direction,
  hasBaseline,
  className = '',
}: {
  percent: number | null
  direction: TrendDirection
  hasBaseline: boolean
  className?: string
}) {
  const { t } = useI18n()
  if (!hasBaseline) {
    return <span className={`shrink-0 t-xs text-steel-500 ${className}`}>{t('n/a')}</span>
  }
  return <DeltaBadge percent={percent ?? 0} direction={direction} className={className} />
}

/** Uppercase section heading sharing the Panel title styling. */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h2 className="t-xs font-bold uppercase tracking-[0.14em] text-steel-500">
        {title}
      </h2>
      {subtitle ? <p className="mt-0.5 t-xs text-steel-500">{subtitle}</p> : null}
    </>
  )
}

/** Right-hand information panel with the headline intelligence indicators. */
export function StatisticsPanel({
  stats,
  zones,
  range,
  compareRange,
  onCompareRangeChange,
  categoryTrends,
  className = '',
}: StatisticsPanelProps) {
  const { t } = useI18n()
  const byCategory = new Map(categoryTrends.map((entry) => [entry.category, entry]))
  const trendColor = TREND_COLORS[stats.trendDirection]
  const watchlist = [...zones]
    .sort((a, b) => b.riskScore - a.riskScore || b.crimeCount - a.crimeCount)
    .slice(0, 5)

  const [mode, setMode] = useState<'day' | 'range'>(
    compareRange && compareRange.from === compareRange.to ? 'day' : 'range',
  )
  const [customFrom, setCustomFrom] = useState(compareRange?.from ?? range.to)
  const [customTo, setCustomTo] = useState(compareRange?.to ?? range.to)
  const customActive = compareRange !== null

  const selectDay = () => {
    if (customActive && mode === 'day') {
      onCompareRangeChange(null)
      return
    }
    setMode('day')
    setCustomTo(customFrom)
    onCompareRangeChange({ from: customFrom, to: customFrom })
  }

  const selectRange = () => {
    if (customActive && mode === 'range') {
      onCompareRangeChange(null)
      return
    }
    setMode('range')
    const safeFrom = customFrom <= customTo ? customFrom : customTo
    const safeTo = customFrom <= customTo ? customTo : customFrom
    setCustomFrom(safeFrom)
    setCustomTo(safeTo)
    onCompareRangeChange({ from: safeFrom, to: safeTo })
  }

  const clearCustom = () => onCompareRangeChange(null)

  const applyDay = (day: string) => {
    setCustomFrom(day)
    setCustomTo(day)
    onCompareRangeChange({ from: day, to: day })
  }

  const applyCustom = (from: string, to: string) => {
    setCustomFrom(from)
    setCustomTo(to)
    const safeFrom = from <= to ? from : to
    const safeTo = from <= to ? to : from
    onCompareRangeChange({ from: safeFrom, to: safeTo })
  }

  return (
    <aside
      className={`flex w-full flex-col ${className}`}
      aria-label={t('Situation statistics')}
    >
      <header className="border-b border-navy-700 px-4 py-3">
        <h2 className="t-sm font-bold uppercase tracking-[0.16em] text-steel-300">
          {t('Situation overview')}
        </h2>
      </header>

      <div className="flex flex-col p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="t-base font-bold uppercase tracking-[0.12em] text-steel-500">
            {t('vs previous')}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectDay}
              aria-pressed={customActive && mode === 'day'}
              title={t('View a single day')}
              className={`rounded-full px-2.5 py-1 t-base font-bold transition-colors ${
                customActive && mode === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-navy-800 text-steel-300 hover:text-steel-100'
              }`}
            >
              {t('Day')}
            </button>
            <button
              type="button"
              onClick={selectRange}
              aria-pressed={customActive && mode === 'range'}
              title={t('View a date range')}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 t-base font-bold transition-colors ${
                customActive && mode === 'range'
                  ? 'bg-blue-600 text-white'
                  : 'bg-navy-800 text-steel-300 hover:text-steel-100'
              }`}
            >
              <CalendarDays className="size-3.5" aria-hidden /> {t('Range')}
            </button>
            {customActive ? (
              <button
                type="button"
                onClick={clearCustom}
                aria-label={t('Clear date filter')}
                title={t('Clear')}
                className="rounded-full bg-navy-800 px-2 py-1 t-base font-bold text-steel-300 transition-colors hover:text-steel-100"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {customActive && mode === 'day' ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              min={range.from}
              max={range.to}
              onChange={(event) => applyDay(event.target.value)}
              aria-label={t('View date')}
              className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-950 px-2 py-1.5 t-base text-steel-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        ) : null}

        {customActive && mode === 'range' ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              min={range.from}
              max={customTo}
              onChange={(event) => applyCustom(event.target.value, customTo)}
              aria-label={t('View from date')}
              className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-950 px-2 py-1.5 t-base text-steel-100 focus:border-blue-500 focus:outline-none"
            />
            <span className="shrink-0 t-sm text-steel-500">{t('to')}</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={range.to}
              onChange={(event) => applyCustom(customFrom, event.target.value)}
              aria-label={t('View to date')}
              className="min-w-0 flex-1 rounded-lg border border-navy-600 bg-navy-950 px-2 py-1.5 t-base text-steel-100 focus:border-blue-500 focus:outline-none"
            />
          </div>
        ) : null}

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="t-xs font-bold uppercase tracking-[0.14em] text-steel-500">
              {t('Change summary')}
            </h2>
            <div className="shrink-0 text-right">
              <span
                className="inline-flex items-center gap-1 font-mono t-metric font-bold leading-none"
                style={{ color: trendColor }}
              >
                <span aria-hidden>{trendGlyph(stats.trendDirection)}</span>
                {formatPercent(stats.trendPercent, 1)}
              </span>
              <p className="mt-1 text-caption text-steel-500">{t('Last 30 days vs previous 30 days')}</p>
            </div>
          </div>
        </section>

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle
              title={t('Crime mix by division')}
              subtitle={
                compareRange
                  ? t('Counts in selected window; trend vs previous window')
                  : t('Counts in dataset; trend vs previous 30 days')
              }
            />
            <InfoPopover
              text={t('The seven crime types are split into two divisions — Property & economic (theft, burglary, vehicle theft, fraud and other) and Violent & person (robbery and assault). Each trend compares the most recent window with the immediately preceding window of the same length; n/a means the previous window had no records of that type.')}
              label={t('About crime divisions')}
            />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CRIME_DIVISIONS.map((division) => {
              const rows = division.categories
                .map((category) => byCategory.get(category))
                .filter((row): row is CategoryTrend => row !== undefined)
                .sort((a, b) => b.total - a.total)
              const groupTotal = rows.reduce((sum, row) => sum + row.total, 0)
              const trend = divisionTrend(rows)
              return (
                <div
                  key={division.id}
                  className="rounded-lg border border-navy-700 bg-navy-800 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 t-base font-bold uppercase tracking-[0.1em] text-steel-200">
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: division.accent }}
                          aria-hidden
                        />
                        <span className="truncate">{t(division.label)}</span>
                      </span>
                      <span className="mt-0.5 block t-xs text-steel-500">
                        {t(division.description)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="font-mono t-sm font-bold text-steel-100">
                        {formatNumber(groupTotal)}
                      </span>
                      <ChangePct {...trend} className="mt-0.5 block" />
                    </span>
                  </div>
                  <ul className="mt-1.5 divide-y divide-navy-700/70">
                    {rows.map((row) => (
                      <li
                        key={row.category}
                        className="flex items-center gap-2 py-1 first:pt-1 last:pb-0"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: CRIME_CATEGORY_COLORS[row.category] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate t-base text-steel-200">
                          {t('category.' + row.category)}
                        </span>
                        <span className="shrink-0 font-mono t-base font-semibold tabular-nums text-steel-100">
                          {formatNumber(row.total)}
                        </span>
                        <ChangePct
                          percent={row.percent}
                          direction={row.direction}
                          hasBaseline={row.hasBaseline}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <SectionTitle title={t('Zone watchlist')} subtitle={t('Highest risk score first')} />
          {watchlist.length > 0 ? (
            <ul className="mt-2 divide-y divide-navy-700">
              {watchlist.map((zone) => (
                <li key={zone.id} className="flex items-center gap-3 py-1 first:pt-0 last:pb-0">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: RISK_LEVEL_COLORS[zone.riskLevel] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate t-title-sm font-semibold text-steel-100">
                        {zone.area}
                      </span>
                      <RiskBadge level={zone.riskLevel} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 t-xl text-steel-500">
                      <span>{zone.id}</span>
                      <span>&middot;</span>
                      <span>{t('category.' + zone.dominantCrime)}</span>
                      <span>&middot;</span>
                      <span>{t('{count} reports', { count: zone.crimeCount })}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <span
                        className="font-mono t-metric font-bold"
                        style={{ color: RISK_LEVEL_COLORS[zone.riskLevel] }}
                      >
                        {zone.riskScore}
                      </span>
                      <TrendIndicator trend={zone.trend} glyphOnly />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 t-sm text-steel-500">{t('No zones match the current filters.')}</p>
          )}
        </section>

        <p className="mt-2.5 border-t border-navy-700 pt-2.5 t-base leading-relaxed text-steel-600">
          {t('All figures derive from synthetic demo records bundled with the app. They are not statistics from any police department or government source.')}
        </p>
      </div>
    </aside>
  )
}