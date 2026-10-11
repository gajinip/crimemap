import { ChevronRight, Navigation, ShieldCheck } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { Recommendation } from '../types'

const PRIORITY_COLORS: Record<Recommendation['priority'], string> = {
  P1: 'border-risk-critical/50 bg-risk-critical/10 text-risk-critical',
  P2: 'border-risk-high/50 bg-risk-high/10 text-risk-high',
  P3: 'border-risk-medium/50 bg-risk-medium/10 text-risk-medium',
}

interface RecommendationCardProps {
  recommendation: Recommendation
  compact?: boolean
  /** Drop the card background/border (used inside swipe strips). */
  plain?: boolean
}

/** Operational recommendation for a zone: what to do, where and when. */
export function RecommendationCard({
  recommendation,
  compact = false,
  plain = false,
}: RecommendationCardProps) {
  const { t } = useI18n()
  const steps = compact ? recommendation.steps.slice(0, 2) : recommendation.steps

  return (
    <div
      className={
        plain
          ? 'p-3'
          : 'rounded-lg border border-blue-500/30 p-3'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 t-2xs font-bold uppercase tracking-[0.16em] text-blue-700">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t('Recommended action')}
          </p>
          <p className="mt-1 t-base font-semibold leading-snug text-steel-100">
            {recommendation.headline}
          </p>
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 t-xs font-bold ${PRIORITY_COLORS[recommendation.priority]}`}
        >
          {recommendation.priority}
        </span>
      </div>

      <ul className="mt-2 space-y-1.5">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-1.5 t-sm leading-snug text-steel-200">
            <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-blue-400" aria-hidden />
            <span>{step}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-blue-500/20 pt-2 t-xs text-steel-400">
        <span className="inline-flex items-center gap-1">
          <Navigation className="size-3" aria-hidden />
          {recommendation.nearestStation.name} ·{' '}
          {(recommendation.nearestStation.distanceMeters / 1000).toFixed(1)} km
        </span>
        <span>{t('Window {window}', { window: recommendation.window })}</span>
        <span>{recommendation.units} {recommendation.units === 1 ? t('unit') : t('units')}</span>
      </div>

      {!compact ? (
        <div className="mt-2 border-t border-blue-500/20 pt-2">
          <p className="t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
            {t('Why this recommendation')}
          </p>
          <ul className="mt-1 space-y-1">
            {recommendation.rationale.map((item) => (
              <li key={item} className="t-xs leading-snug text-steel-400">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recommendation.prediction ? (
        <div className="mt-2 border-t border-blue-500/20 pt-2">
          <p className="t-2xs font-bold uppercase tracking-[0.14em] text-blue-700">
            {t('Forward view')}
            <span className="ml-1.5 font-normal normal-case tracking-normal text-steel-500">
              {t('{points} pts · {confidence}% confidence', { points: `${recommendation.prediction.adjustment > 0 ? '+' : ''}${recommendation.prediction.adjustment}`, confidence: Math.round(recommendation.prediction.confidence * 100) })}
            </span>
          </p>
          <ul className="mt-1 space-y-1">
            {recommendation.prediction.rationale.map((item) => (
              <li key={item} className="t-xs leading-snug text-steel-400">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
