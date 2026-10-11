import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Landmark,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { detectChanges } from '../analytics/changes'
import { computeRiskZones } from '../analytics/risk'
import { InfoPopover } from '../components/ui/InfoPopover'
import { Panel } from '../components/ui/Panel'
import type {
  CategoryStat,
  ChangeReport,
  CrimeCategory,
  CrimeFilterState,
  CrimeIncident,
  PoliceStation,
  RiskZone,
} from '../types'
import { CRIME_CATEGORIES, INCIDENT_STATUSES, RISK_LEVELS, SEVERITIES } from '../types'
import { downloadTextFile, toCsv } from '../utils/export'
import { applyContextFilters, applyCrimeFilters, timePresets, ALL_AREAS } from '../utils/filters'
import { formatDate, formatNumber } from '../utils/format'
import { severityOf } from '../utils/severity'
import {
  buildCategoryStats,
  buildPeriodComparison,
  buildTrendSeries,
  computeDashboardStats,
  computeTrend,
  reportAnchor,
} from '../utils/stats'
import { CRIME_CATEGORY_COLORS } from '../utils/visuals'
import { useI18n } from '../i18n/useI18n'

interface ReportsViewProps {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  changes: ChangeReport
  stations: PoliceStation[]
  stats: unknown
  categoryStats: CategoryStat[]
  filters: CrimeFilterState
}

const ALL_CATEGORIES = 'All Categories' as const

interface ReportFilterDraft {
  periodDays: number | null
  area: string
  category: CrimeCategory | typeof ALL_CATEGORIES
}

const DEFAULT_FILTERS: ReportFilterDraft = {
  periodDays: null,
  area: ALL_AREAS,
  category: ALL_CATEGORIES,
}

const PRESETS = timePresets()



function rangeFor(days: number | null) {
  return (PRESETS.find((preset) => preset.days === days) ?? PRESETS[PRESETS.length - 1]).range
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function exportIncidents(incidents: CrimeIncident[]) {
  const rows = incidents.map((incident) => [
    incident.id,
    incident.occurredAt.slice(0, 10),
    incident.occurredAt.slice(11, 16),
    incident.category,
    severityOf(incident.category),
    incident.area,
    incident.status,
    incident.lat,
    incident.lng,
  ])
  downloadTextFile(
    `crimemap-incidents-${stamp()}.csv`,
    toCsv(
      ['Incident ID', 'Date', 'Time', 'Category', 'Severity', 'Locality', 'Status', 'Lat', 'Lng'],
      rows,
    ),
  )
}

function exportZones(zones: RiskZone[]) {
  const rows = zones.map((zone) => [
    zone.id,
    zone.area,
    zone.riskScore,
    zone.riskLevel,
    zone.trend,
    zone.trendPercent,
    zone.crimeCount,
    zone.previousCount,
    zone.dominantCrime,
    zone.peakWindow,
    zone.peakShare,
    zone.status,
    zone.isEmerging ? 'yes' : 'no',
  ])
  downloadTextFile(
    `crimemap-risk-zones-${stamp()}.csv`,
    toCsv(
      [
        'Zone ID',
        'Locality',
        'Risk Score',
        'Risk Level',
        'Trend',
        'Trend %',
        'Recent',
        'Previous',
        'Dominant Crime',
        'Peak Window',
        'Peak Share %',
        'Status',
        'Emerging',
      ],
      rows,
    ),
  )
}

function exportChanges(report: ChangeReport) {
  const rows = report.signals.map((signal) => [
    signal.id,
    signal.kind,
    signal.severity,
    signal.area,
    signal.headline,
    signal.detail,
    signal.deltaPercent,
    signal.recentCount,
    signal.previousCount,
    signal.category ?? '',
  ])
  downloadTextFile(
    `crimemap-change-signals-${stamp()}.csv`,
    toCsv(
      [
        'Signal ID',
        'Kind',
        'Urgency',
        'Locality',
        'Headline',
        'Detail',
        'Delta %',
        'Recent',
        'Previous',
        'Category',
      ],
      rows,
    ),
  )
}

function exportStations(stations: PoliceStation[]) {
  const rows = stations.map((station) => [
    station.id,
    station.name,
    station.area,
    station.jurisdiction.join('; '),
    station.lat,
    station.lng,
  ])
  downloadTextFile(
    `crimemap-stations-${stamp()}.csv`,
    toCsv(['Station ID', 'Name', 'Locality', 'Jurisdiction', 'Lat', 'Lng'], rows),
  )
}

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: string
  hint: string
  color: string
}

function KpiCard({ icon, label, value, hint, color }: KpiCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3.5">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: `${color}1a`, color }}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate t-sm font-semibold uppercase tracking-[0.1em] text-steel-500">
          {label}
        </p>
        <p className="text-2xl font-bold leading-tight text-steel-100">{value}</p>
        <p className="truncate t-xs text-steel-500">{hint}</p>
      </div>
    </div>
  )
}

function ChangeBadge({ value, available }: { value: number | null; available: boolean }) {
  if (!available) {
    return <span className="t-xs text-steel-500">n/a</span>
  }
  if (value === null) {
    return <span className="t-xs text-steel-500">—</span>
  }
  const flat = value === 0
  const up = value > 0
  const color = flat ? '#7b8ba1' : up ? '#EA4335' : '#34A853'
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className="inline-flex items-center gap-0.5 t-xs font-semibold tabular-nums"
      style={{ color }}
    >
      {flat ? <span aria-hidden>■</span> : <Icon className="size-3.5" aria-hidden />}
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

function CategoryDonut({ data }: { data: CategoryStat[] }) {
  const { t } = useI18n()
  const total = data.reduce((sum, entry) => sum + entry.count, 0)
  const segments = data.filter((entry) => entry.count > 0)
  const [active, setActive] = useState<string | null>(null)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)

  const size = 200
  const strokeWidth = 30
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const activeEntry = segments.find((entry) => entry.category === active) ?? null

  const arcs = segments.reduce<{ entry: CategoryStat; dash: number; offset: number }[]>(
    (built, entry) => {
      const dash = total > 0 ? (entry.count / total) * circumference : 0
      const offset = -built.reduce((sum, arc) => sum + arc.dash, 0)
      built.push({ entry, dash, offset })
      return built
    },
    [],
  )

  const clearActive = () => {
    setActive(null)
    setPointer(null)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-[230px]"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          setPointer({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
        }}
        onMouseLeave={clearActive}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Distribution of ${formatNumber(total)} incidents across ${segments.length} categories`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef3f9"
            strokeWidth={strokeWidth}
          />
          {arcs.map(({ entry, dash, offset }) => {
            const isActive = active === entry.category
            const dimmed = active !== null && !isActive
            return (
              <circle
                key={entry.category}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={CRIME_CATEGORY_COLORS[entry.category]}
                strokeWidth={isActive ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                onMouseEnter={() => setActive(entry.category)}
                onFocus={() => setActive(entry.category)}
                onBlur={clearActive}
                tabIndex={0}
              >
                <title>
                  {`${entry.category}: ${entry.count} (${entry.share}%)`}
                </title>
              </circle>
            )
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
          {activeEntry ? (
            <div className="min-w-0 leading-tight">
              <p className="t-sm font-semibold text-steel-200">{activeEntry.category}</p>
              <p className="mt-1 text-2xl font-bold leading-none text-steel-100">
                {activeEntry.share}%
              </p>
              <p className="mt-1 t-xs uppercase tracking-[0.12em] text-steel-500">
                {formatNumber(activeEntry.count)} {t('incidents')}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold leading-none text-steel-100">{formatNumber(total)}</p>
              <p className="mt-1 t-xs uppercase tracking-[0.14em] text-steel-500">{t('Incidents')}</p>
            </div>
          )}
        </div>

        {activeEntry && pointer ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[135%] rounded-md border border-navy-700 bg-navy-800 px-2.5 py-1.5 shadow-lg"
            style={{ left: pointer.x, top: pointer.y }}
          >
            <span className="flex items-center gap-1.5 t-sm font-semibold text-steel-100">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CRIME_CATEGORY_COLORS[activeEntry.category] }}
                aria-hidden
              />
              <span className="whitespace-nowrap">{activeEntry.category}</span>
            </span>
            <span className="mt-0.5 block whitespace-nowrap t-xs text-steel-400">
              {formatNumber(activeEntry.count)} {t('incidents')} · {activeEntry.share}%
            </span>
          </div>
        ) : null}
      </div>

      {segments.length > 0 ? (
        <ul className="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
          {segments.map((entry) => {
            const isActive = active === entry.category
            return (
              <li
                key={entry.category}
                onMouseEnter={() => setActive(entry.category)}
                onMouseLeave={() => setActive(null)}
                className={`flex min-w-0 items-center gap-2 t-sm transition-colors ${
                  isActive ? 'text-steel-100' : 'text-steel-300'
                }`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full transition-transform duration-150"
                  style={{
                    backgroundColor: CRIME_CATEGORY_COLORS[entry.category],
                    transform: isActive ? 'scale(1.4)' : undefined,
                  }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{entry.category}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {entry.share}%
                </span>
                <span className="w-8 shrink-0 text-right font-mono t-xs text-steel-500">
                  {entry.count}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="t-sm text-steel-500">{t('No incidents match the current filters.')}</p>
      )}
    </div>
  )
}

function TrendChart({
  buckets,
  granularity,
}: {
  buckets: ReturnType<typeof buildTrendSeries>['buckets']
  granularity: ReturnType<typeof buildTrendSeries>['granularity']
}) {
  const { t } = useI18n()
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count))
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 8))
  const hasData = buckets.some((bucket) => bucket.count > 0)

  if (buckets.length === 0) {
    return (
      <p className="py-8 text-center t-sm text-steel-500">
        {t('No timestamped incidents available for a trend.')}
      </p>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex h-40 flex-col justify-between py-px text-right t-2xs tabular-nums text-steel-500">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <span className="border-t border-navy-700" />
            <span className="border-t border-navy-700" />
            <span className="border-t border-navy-700" />
          </div>
          <div className="flex h-40 items-end gap-1">
            {buckets.map((bucket) => {
              const height = (bucket.count / max) * 100
              return (
                <div key={bucket.key} className="min-w-0 flex-1">
                  <div
                    className="w-full rounded-t bg-blue-600 transition-[height] duration-300"
                    style={{ height: `${Math.max(height, bucket.count > 0 ? 4 : 0)}%` }}
                    title={`${bucket.rangeLabel}: ${bucket.count} incident${bucket.count === 1 ? '' : 's'}`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mt-1 flex gap-2">
        <span className="w-6 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-1">
          {buckets.map((bucket, index) => (
            <span
              key={bucket.key}
              className="min-w-0 flex-1 truncate text-center t-2xs uppercase tracking-[0.08em] text-steel-500"
            >
              {index % labelEvery === 0 ? bucket.label : ''}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 t-xs text-steel-500">
        {t('Grouped by {granularity}.', { granularity })} {hasData ? t('Values are counts of demo incidents.') : t('No incidents in this period.')}
      </p>
    </div>
  )
}

/** Reports view: export-ready CompStat-style summary of the filtered dataset. */
export function ReportsView({ incidents, stations, filters }: ReportsViewProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<ReportFilterDraft>(DEFAULT_FILTERS)
  const [applied, setApplied] = useState<ReportFilterDraft>(DEFAULT_FILTERS)

  const areaOptions = useMemo(
    () => [ALL_AREAS, ...Array.from(new Set(incidents.map((incident) => incident.area))).sort()],
    [incidents],
  )

  const appliedRange = rangeFor(applied.periodDays)

  const filterState = useMemo<CrimeFilterState>(
    () => ({
      categories: applied.category === ALL_CATEGORIES ? [...CRIME_CATEGORIES] : [applied.category],
      riskLevels: [...RISK_LEVELS],
      severities: [...SEVERITIES],
      statuses: [...INCIDENT_STATUSES],
      area: applied.area,
      dateRange: appliedRange,
      searchQuery: filters.searchQuery,
    }),
    [applied, appliedRange, filters.searchQuery],
  )

  const filteredIncidents = useMemo(
    () => applyCrimeFilters(incidents, filterState),
    [incidents, filterState],
  )
  const contextIncidents = useMemo(
    () => applyContextFilters(incidents, filterState),
    [incidents, filterState],
  )
  const reportZones = useMemo(
    () => computeRiskZones(contextIncidents, appliedRange),
    [contextIncidents, appliedRange],
  )
  const reportChanges = useMemo(
    () => detectChanges(contextIncidents, appliedRange),
    [contextIncidents, appliedRange],
  )
  const reportStats = useMemo(
    () => computeDashboardStats(filteredIncidents, reportZones, appliedRange, appliedRange),
    [filteredIncidents, reportZones, appliedRange],
  )
  const categoryStats = useMemo(
    () => buildCategoryStats(filteredIncidents),
    [filteredIncidents],
  )
  const trend = useMemo(
    () => buildTrendSeries(filteredIncidents, appliedRange),
    [filteredIncidents, appliedRange],
  )

  const anchor = useMemo(() => reportAnchor(incidents), [incidents])
  const comparison = useMemo(
    () => buildPeriodComparison(contextIncidents, anchor),
    [contextIncidents, anchor],
  )
  const trendCompare = useMemo(
    () => computeTrend(contextIncidents, appliedRange),
    [contextIncidents, appliedRange],
  )

  const visibleStations = useMemo(
    () =>
      applied.area === ALL_AREAS
        ? stations
        : stations.filter(
            (station) =>
              station.area === applied.area || station.jurisdiction.includes(applied.area),
          ),
    [stations, applied.area],
  )

  const periodLabel = `${formatDate(appliedRange.from)} – ${formatDate(appliedRange.to)}`

  const insights: string[] = useMemo(() => {
    if (filteredIncidents.length === 0) {
      return [t('No incidents match the current filters. Adjust the reporting period, area or category.')]
    }
    const lines: string[] = []
    const [top, second] = categoryStats.filter((entry) => entry.count > 0)
    if (top) {
      lines.push(
        t('{category} leads with {count} incidents ({share}% of the period).', {
          category: top.category,
          count: formatNumber(top.count),
          share: top.share,
        }),
      )
    }
    if (second) {
      lines.push(
        t('{category} follows with {count} incidents ({share}%).', {
          category: second.category,
          count: formatNumber(second.count),
          share: second.share,
        }),
      )
    }
    lines.push(
      t('{count} high-risk zone{plural} detected; average risk score {score}/100.', {
        count: reportStats.highRiskZones,
        plural: reportStats.highRiskZones === 1 ? '' : 's',
        score: reportStats.averageRiskScore,
      }),
    )
    if (trendCompare.hasBaseline) {
      const direction =
        trendCompare.direction === 'Rising'
          ? t('up')
          : trendCompare.direction === 'Declining'
            ? t('down')
            : t('flat')
      lines.push(
        t('Volume over the last 30 days is {direction} versus the previous 30 days ({percent}%.)', {
          direction,
          percent: (trendCompare.percent > 0 ? '+' : '') + trendCompare.percent,
        }),
      )
    } else {
      lines.push(t('No previous-period baseline available, so a trend direction cannot be stated.'))
    }
    return lines
  }, [filteredIncidents.length, categoryStats, reportStats, trendCompare, t])

  const exportRows: {
    icon: ReactNode
    color: string
    name: string
    hint: string
    action: string
    onClick: () => void
  }[] = [
    {
      icon: <FileText className="size-4" aria-hidden />,
      color: '#1A73E8',
      name: t('Incidents CSV'),
      hint: t('{count} records', { count: formatNumber(filteredIncidents.length) }),
      action: t('Export'),
      onClick: () => exportIncidents(filteredIncidents),
    },
    {
      icon: <ShieldAlert className="size-4" aria-hidden />,
      color: '#EA4335',
      name: t('Risk Zones CSV'),
      hint: t('{count} zones', { count: formatNumber(reportZones.length) }),
      action: t('Export'),
      onClick: () => exportZones(reportZones),
    },
    {
      icon: <TrendingUp className="size-4" aria-hidden />,
      color: '#F9AB00',
      name: t('Change Signals CSV'),
      hint: t('{count} signals', { count: reportChanges.signals.length }),
      action: t('Export'),
      onClick: () => exportChanges(reportChanges),
    },
    {
      icon: <Landmark className="size-4" aria-hidden />,
      color: '#34A853',
      name: t('Stations CSV'),
      hint: t('{count} stations', { count: formatNumber(visibleStations.length) }),
      action: t('Export'),
      onClick: () => exportStations(visibleStations),
    },
    {
      icon: <Printer className="size-4" aria-hidden />,
      color: '#174ea6',
      name: t('Print / PDF'),
      hint: t('Browser print dialog'),
      action: t('Print'),
      onClick: () => window.print(),
    },
  ]

  const selectClass =
    'h-9 w-full rounded-lg border border-navy-600 bg-navy-800 px-2 t-base text-steel-100 focus:border-blue-500 focus:outline-none'

  return (
    <div className="flex flex-col gap-3 p-3 pb-8 xl:p-4 print:gap-2 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
              <h1 className="t-view-title font-bold leading-tight text-steel-100">
                {t('Reports & Export')}
              </h1>
              <InfoPopover
                label={t('About reports and export')}
                text={t('CompStat-style summary of the current filtered dataset and explainable risk zones. Comparison windows are anchored to the latest date in the demo dataset. Suitable for printing or pasting into operational briefs.')}
              />
          </div>
        </div>
      </header>

      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-steel-100">{t('CrimeMap Puducherry — Reports & Export')}</h1>
        <p className="mt-1 t-sm text-steel-300">
          {t('Reporting period: {period} · Area: {area} · Category: {category} · Comparison anchor: {anchor}', {
            period: periodLabel,
            area: applied.area,
            category: applied.category,
            anchor: formatDate(anchor),
          })}
        </p>
        <p className="mt-0.5 t-xs text-amber-700">
          {t('Demo data - synthetic sample records, not real crime information.')}
        </p>
      </div>

      {/* A. Filter toolbar */}
      <div className="rounded-xl border border-navy-700 bg-navy-800 p-3 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[150px] flex-1 flex-col gap-1">
            <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Reporting period')}
            </span>
            <select
              className={selectClass}
              value={draft.periodDays === null ? 'all' : String(draft.periodDays)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  periodDays:
                    event.target.value === 'all' ? null : Number(event.target.value),
                }))
              }
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[150px] flex-1 flex-col gap-1">
            <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Area')}
            </span>
            <select
              className={selectClass}
              value={draft.area}
              onChange={(event) =>
                setDraft((current) => ({ ...current, area: event.target.value }))
              }
            >
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-[150px] flex-1 flex-col gap-1">
            <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Crime category')}
            </span>
            <select
              className={selectClass}
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value as ReportFilterDraft['category'],
                }))
              }
            >
              <option value={ALL_CATEGORIES}>{t('All categories')}</option>
              {CRIME_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setApplied(draft)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 t-base font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <Search className="size-4" aria-hidden /> {t('Apply Filters')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(DEFAULT_FILTERS)
                setApplied(DEFAULT_FILTERS)
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-3 t-base font-semibold text-steel-300 transition-colors hover:border-navy-500 hover:text-steel-100"
            >
              <RotateCcw className="size-4" aria-hidden /> {t('Reset')}
            </button>
          </div>
        </div>
      </div>

      {/* B. KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<FileText className="size-5" aria-hidden />}
          label={t('Total incidents')}
          value={formatNumber(reportStats.totalIncidents)}
          hint={t('{area} · {period}', { area: applied.area, period: periodLabel })}
          color="#1A73E8"
        />
        <KpiCard
          icon={<ShieldAlert className="size-5" aria-hidden />}
          label={t('High risk zones')}
          value={formatNumber(reportStats.highRiskZones)}
          hint={t('High or critical risk level')}
          color="#EA4335"
        />
        <KpiCard
          icon={<TrendingUp className="size-5" aria-hidden />}
          label={t('Average risk score')}
          value={`${reportStats.averageRiskScore}`}
          hint={t('Weighted 0–100 zone score')}
          color="#F9AB00"
        />
        <KpiCard
          icon={<Landmark className="size-5" aria-hidden />}
          label={t('Police stations')}
          value={formatNumber(visibleStations.length)}
          hint={applied.area === ALL_AREAS ? t('All demo precincts') : t('Covers {area}', { area: applied.area })}
          color="#34A853"
        />
      </div>

      {/* Main analytics grid */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,64fr)_minmax(0,36fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* C. Crime category breakdown */}
          <Panel
            title={t('Crime category breakdown')}
            subtitle={t('Comparison across fixed windows anchored to {anchor}', { anchor: formatDate(anchor) })}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] t-sm">
                <thead>
                  <tr className="border-b border-navy-700 t-2xs uppercase tracking-[0.12em] text-steel-500">
                     <th className="px-2 py-2 text-left">{t('Crime category')}</th>
                    <th className="px-2 py-2 text-right">{t('Current week')}</th>
                    <th className="px-2 py-2 text-right">{t('Previous week')}</th>
                    <th className="px-2 py-2 text-right">{t('% Change')}</th>
                    <th className="px-2 py-2 text-right">{t('28-Day total')}</th>
                    <th className="px-2 py-2 text-right">{t('Previous 28-Day')}</th>
                    <th className="px-2 py-2 text-right">{t('YTD total')}</th>
                    <th className="px-2 py-2 text-right">{t('Previous YTD')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row, index) => (
                    <tr
                      key={row.category}
                      className={`border-b border-navy-700/60 ${
                        index % 2 === 1 ? 'bg-navy-850' : ''
                      }`}
                    >
                      <td className="px-2 py-1.5">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: CRIME_CATEGORY_COLORS[row.category] }}
                            aria-hidden
                          />
                          <span className="font-semibold text-steel-100">{row.category}</span>
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-steel-200">
                        {formatNumber(row.currentWeek)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-steel-300">
                        {formatNumber(row.previousWeek)}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <ChangeBadge value={row.changeWeek} available={comparison.baselines.week} />
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-steel-200">
                        {formatNumber(row.current28)}
                        {comparison.baselines.d28 ? (
                          <span className="ml-1.5">
                            <ChangeBadge value={row.change28} available />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-steel-300">
                        {formatNumber(row.previous28)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-steel-200">
                        {formatNumber(row.currentYtd)}
                        {comparison.baselines.ytd ? (
                          <span className="ml-1.5">
                            <ChangeBadge value={row.changeYtd} available />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-steel-300">
                        {comparison.baselines.ytd ? formatNumber(row.previousYtd) : 'n/a'}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-navy-600 font-bold text-steel-100">
                     <td className="px-2 py-2">{t('Total')}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatNumber(comparison.totals.currentWeek)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-steel-300">
                      {formatNumber(comparison.totals.previousWeek)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <ChangeBadge
                        value={comparison.totals.changeWeek}
                        available={comparison.baselines.week}
                      />
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatNumber(comparison.totals.current28)}
                      {comparison.baselines.d28 ? (
                        <span className="ml-1.5">
                          <ChangeBadge value={comparison.totals.change28} available />
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-steel-300">
                      {formatNumber(comparison.totals.previous28)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatNumber(comparison.totals.currentYtd)}
                      {comparison.baselines.ytd ? (
                        <span className="ml-1.5">
                          <ChangeBadge value={comparison.totals.changeYtd} available />
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-steel-300">
                      {comparison.baselines.ytd
                        ? formatNumber(comparison.totals.previousYtd)
                        : 'n/a'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-steel-500">
               {t('Week and 28-day windows are comparable across the demo dataset. Previous-year (YTD) figures are unavailable because the demo dataset contains no records for the prior year, so they are shown as')} <span className="font-semibold">{t('n/a')}</span> {t('rather than estimated.')}
            </p>
          </Panel>

          {/* E + F. Trend and insights */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title={t('Crime trend (selected period)')} subtitle={periodLabel}>
              <TrendChart buckets={trend.buckets} granularity={trend.granularity} />
            </Panel>

            <Panel title={t('Key insights')} subtitle={t('Derived from the filtered dataset')}>
              <ul className="space-y-2">
                {insights.map((line, index) => (
                  <li key={index} className="flex items-start gap-2 t-sm leading-relaxed text-steel-300">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {/* D. Category distribution */}
          <Panel title={t('Category distribution (current period)')} subtitle={periodLabel}>
            <CategoryDonut data={categoryStats} />
          </Panel>

          {/* G. Export reports */}
          <Panel title={t('Export reports')} subtitle={t('Files respect the active filters')}>
            <ul className="divide-y divide-navy-700">
              {exportRows.map((row) => (
                <li key={row.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-md"
                    style={{ backgroundColor: `${row.color}1a`, color: row.color }}
                    aria-hidden
                  >
                    {row.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate t-base font-semibold text-steel-100">{row.name}</p>
                    <p className="truncate t-xs text-steel-500">{row.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={row.onClick}
                    className="shrink-0 rounded-lg border border-blue-600 px-3 py-1.5 t-sm font-semibold text-blue-600 transition-colors hover:bg-blue-600/10"
                  >
                    {row.action}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
