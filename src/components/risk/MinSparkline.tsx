interface MinSparklineProps {
  data: number[]
  color: string
  label: string
  width?: number
  height?: number
}

/**
 * Compact SVG line chart for daily incident counts. Returns null when there is
 * not enough history to draw, so callers can show a placeholder instead.
 * The data is always the zone's own incident series (synthetic demo records).
 */
export function MinSparkline({
  data,
  color,
  label,
  width = 110,
  height = 30,
}: MinSparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = Math.max(1, max - min)
  const padX = 2
  const padY = 3
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0

  const points = data.map((value, index) => {
    const x = padX + index * step
    const y = height - padY - ((value - min) / range) * (height - padY * 2)
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${height} L ${
    points[0][0]
  } ${height} Z`

  const gradientId = `spark-${color.replace('#', '').toLowerCase()}`

  return (
    <figure className="min-w-0">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </figure>
  )
}