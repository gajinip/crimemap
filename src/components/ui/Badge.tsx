import type { CrimeCategory, IncidentStatus, RiskLevel, TrendDirection } from '../../types'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS, STATUS_COLORS, riskLevelClass, trendGlyph } from '../../utils/visuals'
import { useI18n } from '../../i18n/useI18n'

const BASE = 'inline-flex items-center gap-1 rounded-full border px-2 py-[1px] t-xs font-bold uppercase tracking-[0.08em]'

export function RiskBadge({ level, className = '' }: { level: RiskLevel; className?: string }) {
  const { t } = useI18n()
  return <span className={`${BASE} ${riskLevelClass(level)} ${className}`}>{t('risk.' + level)}</span>
}

export function CategoryBadge({ category }: { category: CrimeCategory }) {
  const { t } = useI18n()
  const color = CRIME_CATEGORY_COLORS[category]
  return (
    <span
      className={BASE}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}1f` }}
    >
      {t('category.' + category)}
    </span>
  )
}

export function StatusBadge({ status }: { status: IncidentStatus | string }) {
  const { t } = useI18n()
  const color = STATUS_COLORS[status] ?? '#94a3b8'
  return (
    <span
      className={BASE}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}1f` }}
    >
      {t('status.' + status)}
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
  const { t } = useI18n()
  const color = STATUS_COLORS[trend] ?? '#94a3b8'
  return (
    <span className="inline-flex items-center gap-1 t-sm font-semibold" style={{ color }}>
      {glyphOnly ? (
        <span className="t-metric leading-none" aria-hidden>
          {trendGlyph(trend)}
        </span>
      ) : (
        <>
          {showGlyph ? <span aria-hidden>{trendGlyph(trend)}</span> : null}
          {t('trend.' + trend)}
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

/**
 * Compact percentage change badge: "▲ 12% / ▼ -8% / ~0%".
 * Renders a neutral value unless a real baseline exists (handled by callers).
 */
export function DeltaBadge({
  percent,
  direction,
  className = '',
}: {
  percent: number
  direction: TrendDirection
  className?: string
}) {
  if (direction === 'Stable') {
    return (
      <span className={`font-mono t-base font-bold text-steel-400 ${className}`}>
        ~{Math.abs(percent)}%
      </span>
    )
  }
  const rising = direction === 'Rising'
  return (
    <span
      className={`font-mono t-base font-bold ${className}`}
      style={{ color: rising ? '#DC2626' : '#16A34A' }}
    >
      {rising ? '▲' : '▼'} {Math.abs(percent)}%
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
