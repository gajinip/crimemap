import type { CrimeCategory, IncidentStatus, RiskLevel, TrendDirection } from '../../types'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS, STATUS_COLORS, riskLevelClass, trendGlyph } from '../../utils/visuals'

const BASE = 'inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10px] font-bold uppercase tracking-[0.08em]'

export function RiskBadge({ level, className = '' }: { level: RiskLevel; className?: string }) {
  return <span className={`${BASE} ${riskLevelClass(level)} ${className}`}>{level}</span>
}

export function CategoryBadge({ category }: { category: CrimeCategory }) {
  const color = CRIME_CATEGORY_COLORS[category]
  return (
    <span
      className={BASE}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}1f` }}
    >
      {category}
    </span>
  )
}

export function StatusBadge({ status }: { status: IncidentStatus | string }) {
  const color = STATUS_COLORS[status] ?? '#94a3b8'
  return (
    <span
      className={BASE}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}1f` }}
    >
      {status}
    </span>
  )
}

export function TrendIndicator({
  trend,
  percent,
  showGlyph = true,
  glyphOnly = false,
}: {
  trend: TrendDirection
  percent?: number
  showGlyph?: boolean
  glyphOnly?: boolean
}) {
  const color = STATUS_COLORS[trend] ?? '#94a3b8'
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color }}>
      {glyphOnly ? (
        <span className="text-[26px] leading-none" aria-hidden>
          {trendGlyph(trend)}
        </span>
      ) : (
        <>
          {showGlyph ? <span aria-hidden>{trendGlyph(trend)}</span> : null}
          {trend}
        </>
      )}
      {typeof percent === 'number' ? (
        <span className="text-steel-400">
          ({percent > 0 ? '+' : ''}
          {percent}%)
        </span>
      ) : null}
    </span>
  )
}

export function DemoChip({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="text-chip inline-flex items-center gap-1 rounded border border-amber-600/50 bg-amber-500/10 px-1.5 py-[1px] font-extrabold uppercase tracking-[0.14em] text-amber-700"
      title="Synthetic sample data - not real crime information"
    >
      DEMO{compact ? '' : ' DATA'}
    </span>
  )
}

export function RiskLevelDot({ level }: { level: RiskLevel }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: RISK_LEVEL_COLORS[level] }}
      aria-hidden
    />
  )
}
