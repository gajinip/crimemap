import { useI18n } from '../i18n/useI18n'
import type { DashboardStats, RiskZone } from '../types'
import { formatPercent } from '../utils/format'
import { RISK_LEVEL_COLORS, trendGlyph } from '../utils/visuals'
import { RiskBadge, TrendIndicator } from './ui/Badge'

interface StatisticsPanelProps {
  stats: DashboardStats
  zones: RiskZone[]
  className?: string
}

const TREND_COLORS: Record<DashboardStats['trendDirection'], string> = {
  Rising: '#DC2626',
  Stable: '#64748B',
  Declining: '#16A34A',
}

/** Uppercase section heading sharing the Panel title styling. */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h2 className="t-xs font-bold uppercase tracking-[0.14em] text-steel-500">
        {title}
      </h2>
      {subtitle ? <p className="mt-0.5 t-xs text-steel-500">{subtitle}</p> : null}
    </>
  )
}

/** Right-hand information panel with the headline intelligence indicators. */
export function StatisticsPanel({ stats, zones, className = '' }: StatisticsPanelProps) {
  const { t } = useI18n()
  // Colour keyed to the overall trend direction (red / amber / green).
  const trendColor = TREND_COLORS[stats.trendDirection]
  // Top 5 zones by risk score, ties broken by incident volume.
  const watchlist = [...zones]
    .sort((a, b) => b.riskScore - a.riskScore || b.crimeCount - a.crimeCount)
    .slice(0, 5)

  return (
    <aside
      className={`flex w-full flex-col ${className}`}
      aria-label={t('Situation statistics')}
    >
      <div className="flex flex-col p-4">
        <section>
          <div className="flex items-start justify-between gap-3">
            <h2 className="t-xs font-bold uppercase tracking-[0.14em] text-steel-500">
              {t('Overall trend')}
            </h2>
            <div className="shrink-0 text-right">
              <span
                className="inline-flex items-center gap-1 font-mono t-metric font-bold leading-none"
                style={{ color: trendColor }}
              >
                <span aria-hidden>{trendGlyph(stats.trendDirection)}</span>
                {formatPercent(stats.trendPercent, 1)}
              </span>
              <p className="mt-1 text-caption text-steel-500">{t('Last 30 days vs previous 30 days')}</p>
            </div>
          </div>
        </section>

        <section className="mt-2.5 border-t border-navy-700 pt-2.5">
          <SectionTitle title={t('Zone watchlist')} subtitle={t('Highest risk score first')} />
          {watchlist.length > 0 ? (
            <ul className="mt-2 divide-y divide-navy-700">
              {watchlist.map((zone) => (
                <li key={zone.id} className="flex items-center gap-3 py-1 first:pt-0 last:pb-0">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: RISK_LEVEL_COLORS[zone.riskLevel] }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate t-title-sm font-semibold text-steel-100">
                        {zone.area}
                      </span>
                      <RiskBadge level={zone.riskLevel} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 t-xl text-steel-500">
                      <span>{zone.id}</span>
                      <span>&middot;</span>
                      <span>{t('category.' + zone.dominantCrime)}</span>
                      <span>&middot;</span>
                      <span>{t('{count} reports', { count: zone.crimeCount })}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <span
                        className="font-mono t-metric font-bold"
                        style={{ color: RISK_LEVEL_COLORS[zone.riskLevel] }}
                      >
                        {zone.riskScore}
                      </span>
                      <TrendIndicator trend={zone.trend} glyphOnly />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 t-sm text-steel-500">{t('No zones match the current filters.')}</p>
          )}
        </section>

        <p className="mt-2.5 border-t border-navy-700 pt-2.5 t-base leading-relaxed text-steel-600">
          {t('All figures derive from synthetic demo records bundled with the app. They are not statistics from any police department or government source.')}
        </p>
      </div>
    </aside>
  )
}
