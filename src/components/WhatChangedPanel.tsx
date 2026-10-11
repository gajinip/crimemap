import { ArrowRight, Radar, X } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { ChangeReport, ChangeSignal } from '../types'
import { formatNumber, formatPercent } from '../utils/format'

const SEVERITY_STYLES: Record<ChangeSignal['severity'], { dot: string; border: string; text: string }> = {
  high: { dot: 'bg-risk-critical', border: 'border-risk-critical/40', text: 'text-risk-critical' },
  medium: { dot: 'bg-risk-high', border: 'border-risk-high/40', text: 'text-risk-high' },
  low: { dot: 'bg-risk-medium', border: 'border-risk-medium/40', text: 'text-risk-medium' },
}

const KIND_LABEL: Record<ChangeSignal['kind'], string> = {
  rising: 'Rising',
  emerging: 'Emerging',
  declining: 'Declining',
}

interface WhatChangedPanelProps {
  report: ChangeReport
  onFocusArea: (area: string) => void
  onClose?: () => void
}

/** "What changed?" - significant differences between the two analysis windows. */
export function WhatChangedPanel({ report, onFocusArea, onClose }: WhatChangedPanelProps) {
  const { t } = useI18n()
  const rising = report.signals.filter((signal) => signal.kind === 'rising').length
  const emerging = report.signals.filter((signal) => signal.kind === 'emerging').length
  const declining = report.signals.filter((signal) => signal.kind === 'declining').length

  return (
    <section className="border-t border-navy-700 pt-3">
      <header className="flex items-start justify-between gap-3 border-b border-navy-700 px-1 pb-3">
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 t-sm font-bold uppercase tracking-[0.16em] text-steel-100">
            <span className="grid size-5 place-items-center rounded bg-amber-400/15 text-amber-700">
              <Radar className="size-3.5" aria-hidden />
            </span>
            {t('Significant changes')}
          </h2>
          <p className="mt-1 t-sm text-steel-500">
            {t('{recent} compared with {previous}', {
              recent: report.window.recentLabel,
              previous: report.window.previousLabel,
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-md border px-2 py-1 t-sm font-bold ${
              report.overallDeltaPercent > 0
                ? 'border-risk-critical/40 bg-risk-critical/10 text-risk-critical'
                : report.overallDeltaPercent < 0
                  ? 'border-risk-low/40 bg-risk-low/10 text-risk-low'
                  : 'border-navy-600 bg-navy-800 text-steel-300'
            }`}
            title={t('City-wide change between the two windows')}
          >
            {t('{value} city-wide', { value: formatPercent(report.overallDeltaPercent) })}
          </span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={t('Close changes panel')}
              className="rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-steel-100"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="px-1 pt-3">
        <p className="t-sm leading-relaxed text-steel-400">
          {t('{recent} incidents in the recent window vs {previous} in the previous window · {rising} rising, {emerging} emerging, {declining} declining.', {
            recent: formatNumber(report.recentTotal),
            previous: formatNumber(report.previousTotal),
            rising,
            emerging,
            declining,
          })}
        </p>

        {report.signals.length === 0 ? (
          <div className="mt-3 rounded-lg border border-navy-600 bg-navy-800 px-4 py-6 text-center">
            <p className="t-base font-semibold text-steel-200">{t('No significant changes')}</p>
            <p className="mt-1 t-sm text-steel-500">
              {t('Every locality is within the significance thresholds for this window.')}
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.signals.map((signal) => {
              const style = SEVERITY_STYLES[signal.severity]
              return (
                <li
                  key={signal.id}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border ${style.border} bg-navy-800/70 px-3 py-2.5`}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="t-base font-bold text-steel-100">{signal.area}</span>
                      <span
                        className={`rounded border border-navy-600 px-1.5 py-px t-2xs font-bold uppercase tracking-[0.12em] ${style.text}`}
                      >
                        {t(KIND_LABEL[signal.kind])}
                      </span>
                      <span className="font-mono t-xs text-steel-400">
                        {signal.kind === 'declining'
                          ? formatPercent(signal.deltaPercent)
                          : signal.kind === 'emerging'
                            ? t('NEW')
                            : formatPercent(signal.deltaPercent)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate t-sm text-steel-200">{signal.headline}</p>
                    <p className="mt-0.5 t-xs leading-snug text-steel-500">{signal.detail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFocusArea(signal.area)}
                    className="inline-flex shrink-0 items-center gap-1 t-xs font-semibold text-blue-400 hover:text-blue-600"
                  >
                    {t('View on map')} <ArrowRight className="size-3" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-navy-700 pt-2">
          <span className="t-xs leading-relaxed text-steel-600">
            {t('Thresholds: rise ≥ 25%, decline ≥ 15%, emerging = no incidents previously.')}
          </span>
        </div>
      </div>
    </section>
  )
}
