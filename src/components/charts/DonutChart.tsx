import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { formatNumber } from '../../utils/format'

export interface DonutDatum {
  label: string
  value: number
  /** Percentage for the legend, e.g. `22.1`. */
  share: number
  color: string
}

interface DonutChartProps {
  data: DonutDatum[]
  size?: number
  strokeWidth?: number
  valueFormatter?: (value: number) => string
  ariaLabel?: string
}

/** Gap (in SVG units) carved out of each arc so neighbouring segments read apart. */
const SEGMENT_GAP = 3

/**
 * Donut chart with cleanly separated segments, a centre summary and an external
 * legend that carries category names + values (the report-page distribution).
 * Hovering a segment pinpoints it in the legend and the centre.
 */
export function DonutChart({
  data,
  size = 190,
  strokeWidth = 26,
  valueFormatter = (value) => formatNumber(value),
  ariaLabel,
}: DonutChartProps) {
  const { t } = useI18n()
  // Skip zero-value slices (they'd render nothing) and total the rest for shares.
  const segments = data.filter((datum) => datum.value > 0)
  const total = data.reduce((sum, datum) => sum + datum.value, 0)
  // Label of the hovered/focused slice; syncs the centre and the legend.
  const [active, setActive] = useState<string | null>(null)

  // Ring geometry: radius sits inside the stroke, and the circumference is the
  // full arc length each share is measured against.
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Convert each slice into an SVG stroke-dash arc. `dash` is the visible arc
  // (share minus the gap) and `offset` walks the start point around the ring.
  const arcs = useMemo(() => {
    return segments
      .reduce<{ arcs: { datum: DonutDatum; dash: number; offset: number }[]; next: number }>(
        (acc, datum) => {
          const length = total > 0 ? (datum.value / total) * circumference : 0
          const dash = Math.max(0, length - SEGMENT_GAP)
          acc.arcs.push({ datum, dash, offset: -acc.next })
          acc.next += length + SEGMENT_GAP
          return acc
        },
        { arcs: [], next: 0 },
      )
      .arcs
  }, [segments, total, circumference])

  // Resolve the active label back to its datum for the centre readout.
  const activeDatum = segments.find((datum) => datum.label === active) ?? null

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full"
          role="img"
          aria-label={
            ariaLabel ??
            `${t('Distribution of')} ${valueFormatter(total)} ${t('incidents')} ${t('across')} ${segments.length} ${t('categories')}`
          }
        >
          {/* Faint full-ring track behind the coloured segments. */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E6ECF3"
            strokeWidth={strokeWidth}
          />
          {arcs.map(({ datum, dash, offset }) => {
            const isActive = active === datum.label
            // Fade the other slices while one is highlighted.
            const dimmed = active !== null && !isActive
            return (
              <circle
                key={datum.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={datum.color}
                // Thicken the active slice for emphasis.
                strokeWidth={isActive ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                // Start the first slice at 12 o'clock instead of 3 o'clock.
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                style={{ opacity: dimmed ? 0.35 : 1 }}
                onMouseEnter={() => setActive(datum.label)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(datum.label)}
                onBlur={() => setActive(null)}
                tabIndex={0}
              >
                {/* Native tooltip fallback (also read by screen readers). */}
                <title>{`${datum.label}: ${valueFormatter(datum.value)} (${datum.share}%)`}</title>
              </circle>
            )
          })}
        </svg>

        {/* Centre readout: the hovered slice's detail, or the grand total idle. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
          {activeDatum ? (
            <div className="min-w-0 leading-tight">
              <p className="truncate t-sm font-semibold text-steel-200">{activeDatum.label}</p>
              <p className="mt-0.5 text-xl font-bold leading-none tabular-nums text-steel-100">
                {activeDatum.share}%
              </p>
              <p className="mt-0.5 t-2xs uppercase tracking-[0.12em] text-steel-500">
                {valueFormatter(activeDatum.value)} {t('incidents')}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold leading-none tabular-nums text-steel-100">
                {valueFormatter(total)}
              </p>
              <p className="mt-0.5 t-2xs uppercase tracking-[0.14em] text-steel-500">
                {t('Incidents')}
              </p>
            </div>
          )}
        </div>
      </div>

      {segments.length > 0 ? (
        // Legend rows double as hover targets that highlight the matching slice.
        <ul className="grid w-full grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {segments.map((datum) => {
            const isActive = active === datum.label
            return (
              <li
                key={datum.label}
                onMouseEnter={() => setActive(datum.label)}
                onMouseLeave={() => setActive(null)}
                className={`flex min-w-0 items-center gap-2 t-sm transition-colors ${
                  isActive ? 'text-steel-100' : 'text-steel-300'
                }`}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full transition-transform duration-150"
                  style={{
                    backgroundColor: datum.color,
                    transform: isActive ? 'scale(1.3)' : undefined,
                  }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{datum.label}</span>
                <span className="shrink-0 font-semibold tabular-nums">{datum.share}%</span>
                <span className="w-9 shrink-0 text-right font-mono t-xs tabular-nums text-steel-500">
                  {valueFormatter(datum.value)}
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