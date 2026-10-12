import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { niceTicks } from '../../utils/chartData'
import { formatNumber, formatPercent } from '../../utils/format'

/** A single comparison series (e.g. "Current period"). */
export interface SeriesDef {
  /** Unique key matched against each group's `values` map. */
  key: string
  /** Human label shown in the legend and tooltip. */
  label: string
  /** Solid fill for the bars and the legend swatch. */
  color: string
}

/** One X-axis category (group) holding a value per series. */
export interface BarGroupDatum {
  key: string
  /** Category label under the X axis and in the tooltip header. */
  label: string
  /** seriesKey -> value. */
  values: Record<string, number>
  /** Percent change between the two series, or null when there is no baseline. */
  changePercent?: number | null
  /** Whether the baseline series had data (drives the tooltip change row). */
  hasBaseline?: boolean
}

interface GroupedBarChartProps {
  title: string
  subtitle?: string
  /** Series rendered as side-by-side bars within each group. */
  series: SeriesDef[]
  /** One entry per X-axis category. */
  data: BarGroupDatum[]
  /** Plot area height in px. */
  height?: number
  valueFormatter?: (value: number) => string
  ariaLabel?: string
}

/**
 * Interactive grouped bar chart comparing series (e.g. current vs previous
 * period) per category. Ships a centered title, a toggleable horizontal legend,
 * clean gridlines with a tuned Y scale, angled category labels for long names,
 * and a hover/touch tooltip with exact values per series. The Y axis always
 * starts at zero.
 */
export function GroupedBarChart({
  title,
  subtitle,
  series,
  data,
  height = 200,
  valueFormatter = (value) => formatNumber(value),
  ariaLabel,
}: GroupedBarChartProps) {
  const { t } = useI18n()
  // Keys of series toggled off in the legend. Hidden series drop out of both the
  // rendering AND the Y-scale, so the remaining bars still fill the plot.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())
  // Key of the group currently hovered / focused / tapped; drives the tooltip.
  const [activeKey, setActiveKey] = useState<string | null>(null)

  // Only the toggled-on series are rendered and measured for the scale.
  const visibleSeries = useMemo(
    () => series.filter((entry) => !hidden.has(entry.key)),
    [series, hidden],
  )

  // Peak value across every visible bar decides the Y scale (never below 0).
  const maxValue = useMemo(
    () =>
      Math.max(
        0,
        ...visibleSeries.flatMap((entry) => data.map((group) => group.values[entry.key] ?? 0)),
      ),
    [visibleSeries, data],
  )
  // Nice round ticks from 0..top and the top tick used to convert values to %.
  const ticks = useMemo(() => niceTicks(maxValue, 4), [maxValue])
  const scaleMax = ticks[ticks.length - 1] ?? maxValue

  // Resolve the active key back to its datum for the tooltip content.
  const activeGroup = data.find((group) => group.key === activeKey) ?? null
  // Angle labels when any name is long or there are many categories, so they
  // don't collide on narrow viewports.
  const rotateLabels = data.some((group) => group.label.length > 9) || data.length > 5

  // Add/remove a series from the hidden set when its legend item is clicked.
  const toggleSeries = (key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Dismiss the tooltip on pointer-leave / blur from the whole chart.
  const clearActive = () => setActiveKey(null)

  return (
    <section className="min-w-0 rounded-xl border border-navy-700 bg-navy-850">
      <header className="flex flex-col gap-2 px-4 pt-4 text-center">
        <h2 className="t-base font-bold uppercase tracking-[0.14em] text-steel-100">
          {t(title)}
        </h2>
        {subtitle ? <p className="t-sm leading-snug text-steel-500">{t(subtitle)}</p> : null}

        {/* Toggleable legend: clicking a series hides/shows its bars. */}
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-0.5">
          {series.map((entry) => {
            const off = hidden.has(entry.key)
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() => toggleSeries(entry.key)}
                  aria-pressed={!off}
                  title={t(off ? 'Show series' : 'Hide series')}
                  className={`inline-flex items-center gap-1.5 t-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    off ? 'text-steel-500' : 'text-steel-200'
                  }`}
                >
                  {/* Filled dot when on; hollow ring when the series is hidden. */}
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={
                      off
                        ? { border: `1.5px solid ${entry.color}`, backgroundColor: 'transparent' }
                        : { backgroundColor: entry.color }
                    }
                  />
                  <span className={off ? 'line-through decoration-steel-500/70' : undefined}>
                    {t(entry.label)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </header>

      <div
        className="px-3 pb-2 pt-4 sm:px-4"
        role="img"
        aria-label={ariaLabel ?? t(title)}
        onMouseLeave={clearActive}
      >
        <div className="flex gap-2" style={{ height }}>
          {/* Y axis: one label per tick, positioned at the exact gridline height. */}
          <div className="relative w-8 shrink-0" aria-hidden>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2 t-2xs tabular-nums leading-none text-steel-400"
                style={{ bottom: `${(tick / Math.max(1, scaleMax)) * 100}%` }}
              >
                {valueFormatter(tick)}
              </span>
            ))}
          </div>

          {/* Plot area: gridlines behind, grouped bars in front. */}
          <div className="relative min-w-0 flex-1">
            <div aria-hidden className="absolute inset-0">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute inset-x-0 border-t border-navy-700/60"
                  style={{ bottom: `${(tick / Math.max(1, scaleMax)) * 100}%` }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-end gap-1.5">
              {data.map((group, index) => {
                const isActive = activeKey === group.key
                // Fade the other groups while one is active to highlight it.
                const dimmed = activeKey !== null && !isActive
                return (
                  <div
                    key={group.key}
                    role="group"
                    tabIndex={0}
                    aria-label={`${group.label}: ${visibleSeries
                      .map((entry) => `${entry.label} ${valueFormatter(group.values[entry.key] ?? 0)}`)
                      .join(', ')}`}
                    className="group relative flex h-full min-w-0 flex-1 items-end gap-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    // Mouse, keyboard focus and touch all open the same tooltip.
                    onMouseEnter={() => setActiveKey(group.key)}
                    onMouseLeave={clearActive}
                    onFocus={() => setActiveKey(group.key)}
                    onBlur={clearActive}
                    onTouchStart={() => setActiveKey(group.key)}
                  >
                    {visibleSeries.map((entry) => {
                      const value = group.values[entry.key] ?? 0
                      const pct = scaleMax > 0 ? (value / scaleMax) * 100 : 0
                      return (
                        <div
                          key={entry.key}
                          className="flex h-full min-w-0 flex-1 items-end"
                        >
                          <div
                            className={`w-full rounded-t-[3px] transition-[height,opacity] duration-300 ${
                              isActive
                                ? 'opacity-100'
                                : dimmed
                                  ? 'opacity-35'
                                  : 'opacity-90 group-hover:opacity-100'
                            }`}
                            // Keep a 3% sliver for non-zero values so tiny bars
                            // stay visible; glow softly when active.
                            style={{
                              height: `${Math.max(pct, value > 0 ? 3 : 0)}%`,
                              backgroundColor: entry.color,
                              boxShadow: isActive ? `0 6px 18px ${entry.color}55` : undefined,
                            }}
                          />
                        </div>
                      )
                    })}

                    {/* Desktop floating tooltip (hidden on the smallest phones). */}
                    {isActive && activeGroup ? (
                      <div
                        // Anchor edge groups inward so the tooltip can't overflow
                        // the card; middle groups stay centered.
                        className={`pointer-events-none absolute -top-1 z-10 hidden w-max max-w-[14rem] -translate-y-full rounded-md border border-navy-700 bg-navy-800 px-2.5 py-1.5 text-left shadow-lg min-[480px]:block ${
                          index === 0 || index === 1
                            ? 'right-0'
                            : index >= data.length - 2
                              ? 'left-0'
                              : 'left-1/2 -translate-x-1/2'
                        }`}
                      >
                        <p className="t-xs font-bold leading-tight text-steel-100">
                          {activeGroup.label}
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {visibleSeries.map((entry) => (
                            <li
                              key={entry.key}
                              className="flex items-center justify-between gap-3 t-2xs leading-tight"
                            >
                              <span className="flex min-w-0 items-center gap-1.5 text-steel-300">
                                <span
                                  className="size-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                  aria-hidden
                                />
                                <span className="truncate">{t(entry.label)}</span>
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums text-steel-100">
                                {valueFormatter(activeGroup.values[entry.key] ?? 0)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1 border-t border-navy-700 pt-0.5 t-2xs leading-tight">
                          {/* Red for an increase, green for a drop, or a note when
                              there is no baseline to compare against. */}
                          {typeof activeGroup.changePercent === 'number' ? (
                            <span
                              className={`font-semibold tabular-nums ${
                                activeGroup.changePercent >= 0
                                  ? 'text-risk-high'
                                  : 'text-risk-low'
                              }`}
                            >
                              {t('Change')}: {formatPercent(activeGroup.changePercent)}
                            </span>
                          ) : (
                            <span className="text-steel-500">{t('No prior period data')}</span>
                          )}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* X labels: fixed-height row; rotated from `top right` so long names
            drop below the plot instead of overlapping it. */}
        <div className="mt-2 flex gap-2">
          <span className="w-8 shrink-0" aria-hidden />
          <div
            className="relative min-w-0 flex-1"
            style={{ height: rotateLabels ? 62 : 16 }}
          >
            <div
              className="grid h-full"
              style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
            >
              {data.map((group) => (
                <div key={group.key} className="relative h-full">
                  {rotateLabels ? (
                    <span
                      className="absolute right-0 top-0 block text-left t-2xs leading-none text-steel-500"
                      style={{
                        transform: 'rotate(-40deg)',
                        transformOrigin: 'top right',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {group.label}
                    </span>
                  ) : (
                    <span className="absolute inset-x-0 top-0 block truncate text-center t-2xs leading-none text-steel-500">
                      {group.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile detail strip: on tiny screens the floating tooltip is hidden,
            so tapping a bar reports the exact series values inline instead. */}
        {activeGroup ? (
          <div className="mt-3 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 min-[480px]:hidden">
            <p className="t-xs font-bold text-steel-100">{activeGroup.label}</p>
            <ul className="mt-1 space-y-0.5">
              {visibleSeries.map((entry) => (
                <li
                  key={entry.key}
                  className="flex items-center justify-between gap-3 t-2xs"
                >
                  <span className="flex items-center gap-1.5 text-steel-300">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                      aria-hidden
                    />
                    {t(entry.label)}
                  </span>
                  <span className="font-semibold tabular-nums text-steel-100">
                    {valueFormatter(activeGroup.values[entry.key] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-0.5 border-t border-navy-700 pt-0.5 t-2xs">
              {typeof activeGroup.changePercent === 'number' ? (
                <span className="font-semibold tabular-nums text-steel-200">
                  {t('Change')}: {formatPercent(activeGroup.changePercent)}
                </span>
              ) : (
                <span className="text-steel-500">{t('No prior period data')}</span>
              )}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}