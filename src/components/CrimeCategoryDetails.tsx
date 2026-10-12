import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { CrimeCategory, CrimeIncident, DateRange } from '../types'
import { buildCategoryDetail } from '../utils/categoryInsights'
import { CRIME_CATEGORY_SERIES } from '../utils/chartPalette'
import { formatDate, formatNumber, formatPercent } from '../utils/format'
import { Sheet } from './ui/Sheet'

interface CrimeCategoryDetailsProps {
  category: CrimeCategory
  /** The currently filtered incidents (already scoped to area/date/filters). */
  incidents: CrimeIncident[]
  range: DateRange
  onClose: () => void
}

/** Section wrapper giving every block a consistent heading and card surface. */
function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  const { t } = useI18n()
  return (
    <section className="rounded-xl border border-navy-600 bg-navy-800/60 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="t-2xs font-bold uppercase tracking-[0.14em] text-steel-400">{t(title)}</h3>
        {hint ? <span className="shrink-0 t-2xs text-steel-500">{hint}</span> : null}
      </div>
      <div className="mt-2 space-y-1.5 t-sm text-steel-300">{children}</div>
    </section>
  )
}

/** One label/value line inside a section. */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-steel-500">{label}</span>
      <span className="text-right font-medium text-steel-100">{value}</span>
    </div>
  )
}

/**
 * Horizontal distribution used for area, monthly, weekday and hour breakdowns.
 * Tracks are scaled to the largest value so rows stay comparable at a glance.
 */
function Distribution({
  items,
  accent,
}: {
  items: { label: string; count: number }[]
  accent: string
}) {
  const max = Math.max(1, ...items.map((item) => item.count))
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 truncate text-steel-500">{item.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-700/60">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: accent }}
            />
          </span>
          <span className="w-7 shrink-0 text-right font-mono tabular-nums text-steel-300">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Detail view for a single crime category, opened from the category nav under
 * "Incidents by crime category". Every section is computed from the filtered
 * demo incidents; dimensions the dataset cannot support (subtypes, prior-year
 * counts, population rates) are stated as unavailable rather than estimated.
 */
export function CrimeCategoryDetails({
  category,
  incidents,
  range,
  onClose,
}: CrimeCategoryDetailsProps) {
  const { t } = useI18n()
  const detail = useMemo(
    () => buildCategoryDetail(incidents, category, range),
    [incidents, category, range],
  )
  const accent = CRIME_CATEGORY_SERIES[category]
  const categoryLabel = t('category.' + category)

  // Latest recorded incident date for this category, used as the data stamp.
  const latestAt = useMemo(() => {
    let latest = ''
    for (const incident of incidents) {
      if (incident.category !== category) continue
      const day = incident.occurredAt.slice(0, 10)
      if (day > latest) latest = day
    }
    return latest
  }, [incidents, category])

  const rising = detail.changePercent !== null && detail.changePercent > 5
  const falling = detail.changePercent !== null && detail.changePercent < -5
  const changeColor = rising ? '#DC2626' : falling ? '#16A34A' : undefined
  const changeLabel =
    detail.hasBaseline && detail.changePercent !== null
      ? formatPercent(detail.changePercent, 1)
      : t('n/a')

  // Narrative intelligence derived from the computed facts.
  const findings: string[] = []
  if (detail.topArea) {
    findings.push(
      t('{area} accounts for {share}% of recorded {category} incidents.', {
        area: detail.topArea.name,
        share: detail.topArea.share,
        category: categoryLabel,
      }),
    )
  }
  if (detail.peakDay) {
    findings.push(
      t('Most incidents fall on {day} ({count} recorded).', {
        day: detail.peakDay.label,
        count: detail.peakDay.count,
      }),
    )
  }
  if (detail.peakHour) {
    findings.push(
      t('Activity concentrates in the {window} window ({count} recorded).', {
        window: detail.peakHour.label,
        count: detail.peakHour.count,
      }),
    )
  }
  if (detail.hasBaseline) {
    findings.push(
      t('Recorded volume is {change} versus the previous period.', { change: changeLabel }),
    )
  }
  if (findings.length === 0) findings.push(t('Not enough records to identify a pattern.'))

  // Evidence-based suggestions for follow-up.
  const recommendations: string[] = []
  if (detail.topArea) {
    recommendations.push(t('Review patrol coverage around {area}.', { area: detail.topArea.name }))
  }
  if (detail.peakHour) {
    recommendations.push(
      t('Consider additional presence during {window}.', { window: detail.peakHour.label }),
    )
  }
  if (detail.pending > 0) {
    recommendations.push(t('Follow up on {count} open cases.', { count: detail.pending }))
  }
  recommendations.push(t('Validate findings against official records before operational use.'))

  return (
    <Sheet
      ariaLabel={t('{category} analysis', { category: categoryLabel })}
      onClose={onClose}
      header={
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 px-2 py-0.5 t-xs font-bold"
            style={{ color: accent }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
            {t('Crime category')}
          </span>
          <h2 className="mt-1.5 truncate t-md font-semibold text-steel-100">{categoryLabel}</h2>
          <p className="t-xs text-steel-500">
            {formatNumber(detail.total)} {t('incidents')} · {detail.overallShare}% {t('of all')}
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Section title="Crime overview">
          <Row label={t('Total incidents')} value={formatNumber(detail.total)} />
          <Row
            label={t('Reporting period')}
            value={`${formatDate(range.from)} – ${formatDate(range.to)}`}
          />
          <Row
            label={t('Change vs previous period')}
            value={
              detail.hasBaseline ? (
                <span style={{ color: changeColor }}>{changeLabel}</span>
              ) : (
                t('No baseline')
              )
            }
          />
          <Row label={t('Share of all incidents')} value={`${detail.overallShare}%`} />
        </Section>

        <Section
          title="Geographic analysis"
          hint={t('{count} localities', { count: detail.areas.length })}
        >
          {detail.areas.length > 0 ? (
            <Distribution
              items={detail.areas.slice(0, 6).map((area) => ({ label: area.name, count: area.count }))}
              accent={accent}
            />
          ) : (
            <p className="t-sm text-steel-500">{t('No locality data in this period.')}</p>
          )}
        </Section>

        <Section title="Hotspot analysis">
          {detail.topArea ? (
            <Row
              label={t('Top concentration')}
              value={`${detail.topArea.name} · ${detail.topArea.count}`}
            />
          ) : (
            <p className="t-sm text-steel-500">{t('No concentration detected.')}</p>
          )}
          <Row
            label={t('Average per locality')}
            value={detail.areas.length > 0 ? (detail.total / detail.areas.length).toFixed(1) : '0'}
          />
          {detail.peakMonth ? (
            <Row
              label={t('Busiest month')}
              value={`${detail.peakMonth.label} · ${detail.peakMonth.count}`}
            />
          ) : null}
          <p className="t-xs text-steel-500">
            {t('Derived from locality clustering of recorded incidents.')}
          </p>
        </Section>

        <Section title="Trend analysis">
          {detail.monthly.length > 0 ? (
            <Distribution items={detail.monthly} accent={accent} />
          ) : (
            <p className="t-sm text-steel-500">{t('No monthly points in range')}</p>
          )}
          <Row label={t('This year (YTD)')} value={formatNumber(detail.total)} />
          <Row label={t('Previous year (YTD)')} value={t('n/a')} />
          <p className="t-xs text-steel-500">
            {t('Prior-year counts and population-based rates are unavailable in the demo dataset.')}
          </p>
        </Section>

        <Section title="Temporal analysis">
          {detail.peakDay ? (
            <Row
              label={t('Peak day')}
              value={`${detail.peakDay.label} · ${detail.peakDay.count}`}
            />
          ) : null}
          {detail.peakHour ? (
            <Row
              label={t('Peak window')}
              value={`${detail.peakHour.label} · ${detail.peakHour.count}`}
            />
          ) : null}
          <p className="t-2xs uppercase tracking-[0.12em] text-steel-500">{t('By day of week')}</p>
          <Distribution items={detail.byDay} accent={accent} />
          <p className="t-2xs uppercase tracking-[0.12em] text-steel-500">{t('By time of day')}</p>
          <Distribution items={detail.byHour} accent={accent} />
        </Section>

        <Section title="Crime subtypes">
          <Row label={t('Selected category')} value={categoryLabel} />
          <p className="t-sm text-steel-500">
            {t('The bundled dataset records incidents at category level only; no finer subtype field is available.')}
          </p>
        </Section>

        <Section title="Case management">
          <Row label={t('Pending')} value={formatNumber(detail.pending)} />
          <Row label={t('Cleared')} value={formatNumber(detail.cleared)} />
          {detail.statuses.map((status) => (
            <Row
              key={status.name}
              label={t('status.' + status.name)}
              value={`${formatNumber(status.count)} · ${status.share}%`}
            />
          ))}
        </Section>

        <Section title="Comparative analysis">
          {detail.topArea ? (
            <Row
              label={t('Highest locality')}
              value={`${detail.topArea.name} · ${detail.topArea.count}`}
            />
          ) : null}
          {detail.lowestArea ? (
            <Row
              label={t('Lowest locality')}
              value={`${detail.lowestArea.name} · ${detail.lowestArea.count}`}
            />
          ) : null}
          <Row label={t('Current window')} value={formatNumber(detail.current)} />
          <Row label={t('Previous window')} value={formatNumber(detail.previous)} />
        </Section>

        <Section title="Intelligence findings">
          <ul className="space-y-1.5">
            {findings.map((line, index) => (
              <li key={index} className="flex items-start gap-2">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="t-xs text-steel-500">
            {t('Observations are patterns in the demo data and require verification.')}
          </p>
        </Section>

        <Section title="Recommendations">
          <ul className="space-y-1.5">
            {recommendations.map((line, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Data quality">
          <Row label={t('Source')} value={t('Bundled demo dataset')} />
          <Row label={t('Records missing fields')} value="0" />
          <Row label={t('Localities covered')} value={formatNumber(detail.areas.length)} />
          <Row
            label={t('Last updated')}
            value={latestAt ? formatDate(latestAt) : formatDate(range.to)}
          />
          <p className="t-xs font-bold uppercase tracking-[0.08em] text-amber-700">
            {t('DEMO DATA - NOT REAL CRIME INFORMATION')}
          </p>
        </Section>
      </div>
    </Sheet>
  )
}
