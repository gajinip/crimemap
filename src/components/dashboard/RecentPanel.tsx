import { Activity } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'
import type { CategoryStat, CrimeIncident, MonthPoint, RiskZone } from '../../types'
import type { CategoryTrend } from '../../utils/stats'
import { formatDate, formatNumber } from '../../utils/format'
import { severityOf } from '../../utils/severity'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { Panel } from '../ui/Panel'

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#34A853',
  Medium: '#F9AB00',
  High: '#FA7B17',
  Critical: '#EA4335',
}

interface RecentPanelProps {
  recent: CrimeIncident[]
  total: number
  categoryStats: CategoryStat[]
  zones: RiskZone[]
  monthly: MonthPoint[]
  categoryTrends: CategoryTrend[]
  rollingTrend: boolean
}

export function RecentPanel({
  recent,
  total,
  categoryStats,
  zones,
  monthly,
  categoryTrends,
  rollingTrend,
}: RecentPanelProps) {
  const { t } = useI18n()
  const insights: string[] = []
  const top = categoryStats[0]
  if (top && top.count > 0) {
    insights.push(
      t('Most frequent crime: {category} — {count} ({share}%)', {
        category: t('category.' + top.category),
        count: formatNumber(top.count),
        share: top.share,
      }),
    )
  }
  const maxRiskZone = zones.reduce<RiskZone | null>((best, zone) => (best && best.riskScore >= zone.riskScore ? best : zone), null)
  if (maxRiskZone) {
    insights.push(
      t('Highest-risk area: {area} ({score}/100)', {
        area: maxRiskZone.area,
        score: maxRiskZone.riskScore,
      }),
    )
  }
  if (monthly.length > 0) {
    const peak = monthly.reduce((best, point) => (point.count > best.count ? point : best), monthly[0])
    if (peak.count > 0) {
      insights.push(
        t('Peak month: {label} — {count} incidents', {
          label: peak.label,
          count: formatNumber(peak.count),
        }),
      )
    }
  }
  const swing = [...categoryTrends]
    .filter((row) => row.hasBaseline && row.percent !== null)
    .sort((a, b) => Math.abs(b.percent ?? 0) - Math.abs(a.percent ?? 0))[0]
  if (swing && swing.percent !== null) {
    const trendLabel = rollingTrend ? t(' vs prior 30 days') : t(' vs previous window')
    insights.push(
      t('{category} moved {direction} {percent}%{suffix}', {
        category: t('category.' + swing.category),
        direction: t('trend.' + swing.direction).toLowerCase(),
        percent: Math.abs(swing.percent),
        suffix: trendLabel,
      }),
    )
  }

  return (
    <Panel
      title={t('Recent incidents')}
      subtitle={t('{count} incidents in the current window · latest first', { count: formatNumber(total) })}
    >
      {recent.length > 0 ? (
        <ul className="divide-y divide-navy-700/70">
          {recent.map((incident) => {
            const severity = severityOf(incident.category)
            return (
              <li key={incident.id} className="flex items-center gap-2.5 py-1.5 first:pt-0 last:pb-0">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CRIME_CATEGORY_COLORS[incident.category] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate t-sm font-semibold text-steel-100">
                      {t('category.' + incident.category)}
                    </span>
                    <span className="shrink-0 t-xs text-steel-500">{formatDate(incident.occurredAt)}</span>
                  </span>
                  <span className="block truncate t-xs text-steel-500">
                    {incident.area} · {t('status.' + incident.status)}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 t-2xs font-bold uppercase tracking-[0.08em]"
                  style={{
                    color: SEVERITY_COLORS[severity],
                    backgroundColor: `${SEVERITY_COLORS[severity]}1A`,
                  }}
                >
                  {t('severity.' + severity)}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-4 text-center t-sm text-steel-500">{t('No incidents in this window.')}</p>
      )}

      {insights.length > 0 ? (
        <div className="mt-2 border-t border-navy-700 pt-2">
          <h3 className="t-xs font-bold uppercase tracking-[0.14em] text-steel-500">{t('Key insights')}</h3>
          <ul className="mt-1.5 space-y-1">
            {insights.map((text) => (
              <li key={text} className="flex gap-1.5 t-sm text-steel-400">
                <Activity className="mt-0.5 size-3.5 shrink-0 text-blue-600" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-2 border-t border-navy-700 pt-2 t-xs text-steel-500">
        {t('Insights are computed from the demo dataset.')}
      </div>
    </Panel>
  )
}