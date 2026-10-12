import { useI18n } from '../../i18n/useI18n'
import type { Recommendation, RiskZone } from '../../types'
import { RecommendationCard } from '../RecommendationCard'
import { RiskBreakdown } from '../RiskBreakdown'
import { TrendIndicator } from '../ui/Badge'
import { DetailSheet } from './DetailSheet'

interface ZoneDetailPanelProps {
  zone: RiskZone
  recommendation: Recommendation | null
  onClose: () => void
  onFocusArea: (area: string) => void
}

/** Explainable score plus operational recommendation for a selected zone. */
export function ZoneDetailBody({
  zone,
  recommendation,
  onFocusArea,
}: Pick<ZoneDetailPanelProps, 'zone' | 'recommendation' | 'onFocusArea'>) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3">
      <RiskBreakdown zone={zone} title={t('Why is {area} high risk?', { area: zone.area })} />

      {recommendation ? <RecommendationCard recommendation={recommendation} /> : null}

      <div className="grid grid-cols-2 gap-2 t-xs">
        <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
          <p className="font-bold uppercase tracking-[0.12em] text-steel-500">{t('Peak time')}</p>
          <p className="mt-0.5 t-base font-semibold text-steel-100">{zone.peakWindow}</p>
          <p className="text-steel-500">{t('{share}% of incidents', { share: zone.peakShare })}</p>
        </div>
        <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
          <p className="font-bold uppercase tracking-[0.12em] text-steel-500">{t('Repeat spots')}</p>
          <p className="mt-0.5 t-base font-semibold text-steel-100">{zone.repeatShare}%</p>
          <p className="text-steel-500">{t('within 250 m')}</p>
        </div>
        <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
          <p className="font-bold uppercase tracking-[0.12em] text-steel-500">{t('Previous window')}</p>
          <p className="mt-0.5 t-base font-semibold text-steel-100">
            {t('{count} incidents', { count: zone.previousCount })}
          </p>
          <p className="text-steel-500">{t('now {count}', { count: zone.crimeCount })}</p>
        </div>
        <div className="rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2">
          <p className="font-bold uppercase tracking-[0.12em] text-steel-500">{t('Nearby activity')}</p>
          <p className="mt-0.5 t-base font-semibold text-steel-100">
            {t('{count} incidents', { count: zone.nearbyCount })}
          </p>
          <p className="text-steel-500">{t('within 3 km')}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onFocusArea(zone.area)}
        className="rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 t-sm font-semibold text-white hover:bg-blue-500"
      >
        {t('Focus map on {area}', { area: zone.area })}
      </button>
    </div>
  )
}

/** Compact header shared by the sheet and the desktop rail variants. */
export function ZoneDetailHeader({ zone }: { zone: RiskZone }) {
  const { t } = useI18n()

  return (
    <>
      <p className="t-2xs font-bold uppercase tracking-[0.16em] text-steel-500">
        {t('Zone analysis · {id}', { id: zone.id })}
      </p>
      <h2 className="truncate t-md font-semibold text-steel-100">{zone.area}</h2>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <TrendIndicator trend={zone.trend} percent={zone.trendPercent} />
        <span className="t-xs text-steel-500">
          {t('{count} incidents', { count: zone.crimeCount })} · {t('category.' + zone.dominantCrime)}
        </span>
      </div>
    </>
  )
}

/**
 * Selected-zone intelligence shown in the shared detail panel (bottom sheet on
 * mobile, right drawer on desktop): explainable score plus the recommendation.
 */
export function ZoneDetailPanel({
  zone,
  recommendation,
  onClose,
  onFocusArea,
}: ZoneDetailPanelProps) {
  const { t } = useI18n()

  return (
    <DetailSheet
      ariaLabel={t('Risk analysis for {area}', { area: zone.area })}
      onClose={onClose}
      header={<ZoneDetailHeader zone={zone} />}
    >
      <ZoneDetailBody zone={zone} recommendation={recommendation} onFocusArea={onFocusArea} />
    </DetailSheet>
  )
}
