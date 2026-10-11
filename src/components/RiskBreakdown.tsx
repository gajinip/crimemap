import { useI18n } from '../i18n/useI18n'
import { RiskBadge } from './ui/Badge'
import { RISK_LEVEL_COLORS } from '../utils/visuals'
import type { RiskZone } from '../types'

interface RiskBreakdownProps {
  zone: RiskZone
  title?: string
  compact?: boolean
}

/**
 * Explains a zone's risk score factor by factor - the score is never shown
 * without the measurements that produced it.
 */
export function RiskBreakdown({ zone, title, compact = false }: RiskBreakdownProps) {
  const { t } = useI18n()
  const color = RISK_LEVEL_COLORS[zone.riskLevel]

  return (
    <div className="rounded-lg border border-navy-600 bg-navy-800/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-[1_1_12rem]">
          <p className="t-2xs font-bold uppercase tracking-[0.16em] text-steel-500">
            {title ?? t('Why is {area} at risk?', { area: zone.area })}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="t-metric font-bold leading-none" style={{ color }}>
              {zone.riskScore}
            </span>
            <span className="t-base text-steel-400">/ 100</span>
            <RiskBadge level={zone.riskLevel} />
          </div>
        </div>
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full t-xs font-bold"
          style={{ backgroundColor: `${color}1f`, color }}
          aria-hidden
        >
          {Math.round(
            (zone.components.reduce((sum, component) => sum + component.points, 0) /
              Math.max(
                1,
                zone.components.reduce((sum, component) => sum + component.max, 0),
              )) *
              100,
          )}
          %
        </span>
      </div>

      <ul className={`mt-3 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 ${compact ? '' : 'min-[640px]:gap-3'}`}>
        {zone.components.map((component) => {
          const width = Math.max(0, Math.min(100, (component.points / component.max) * 100))
          return (
            <li key={component.key}>
              <div className="flex items-baseline justify-between gap-2 t-sm">
                <span className="truncate text-steel-200">{component.label}</span>
                <span className="shrink-0 font-mono t-xs font-semibold text-steel-300">
                  +{component.points} / {component.max}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
              <p className="mt-0.5 t-xs leading-snug text-steel-500">{component.detail}</p>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 border-t border-navy-700 pt-2 t-xs leading-relaxed text-steel-600">
        {t('Overall risk:')} <span className="font-semibold text-steel-300">{zone.riskScore} / 100 — {t('risk.' + zone.riskLevel)}</span>.
        {t('The score is the weighted sum of the six measurements above - same data, same score.')}
      </p>
    </div>
  )
}
