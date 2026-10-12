export interface LegendItem {
  label: string
  color: string
  /** Optional value shown after the label (count, share, etc.). */
  value?: number | string
}

interface ChartLegendProps {
  items: LegendItem[]
  className?: string
}

/**
 * Compact series legend (colour swatch + name + optional value) shared by the
 * bar and donut charts.
 */
export function ChartLegend({ items, className = '' }: ChartLegendProps) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="flex min-w-0 items-center gap-1.5 t-xs">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="truncate font-medium text-steel-300">{item.label}</span>
          {item.value !== undefined ? (
            <span className="shrink-0 font-semibold tabular-nums text-steel-200">
              {item.value}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}