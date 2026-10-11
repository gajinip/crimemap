import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { CrimeIncident } from '../types'
import { formatDateTime, formatNumber } from '../utils/format'
import { StatusBadge, CategoryBadge } from './ui/Badge'
import { Panel } from './ui/Panel'

interface CrimeTableProps {
  incidents: CrimeIncident[]
  maxRows?: number
}

/** Compact incident table for the dashboard view. */
export function CrimeTable({ incidents, maxRows = 8 }: CrimeTableProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? incidents : incidents.slice(0, maxRows)

  return (
    <Panel
      title={t('Recent demo incidents')}
      subtitle={t('Last {count} of {total} filtered records', { count: rows.length, total: formatNumber(incidents.length) })}
      actions={
        incidents.length > maxRows ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="t-xs font-semibold uppercase tracking-[0.1em] text-blue-400 hover:text-blue-600"
          >
            {expanded ? t('Show less') : t('Show all {count}', { count: formatNumber(incidents.length) })}
          </button>
        ) : null
      }
    >
      <div className="space-y-2 md:hidden">
        {rows.map((incident) => (
          <div
            key={incident.id}
            className="rounded-lg border border-navy-700 bg-navy-800/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono t-xs text-steel-400">{incident.id}</span>
              <span className="shrink-0 t-xs text-steel-500">
                {formatDateTime(incident.occurredAt)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={incident.category} />
              <StatusBadge status={incident.status} />
            </div>
            <p className="mt-1.5 t-base font-semibold text-steel-100">{incident.area}</p>
            <p className="mt-0.5 t-sm leading-snug text-steel-400">
              {incident.description}
            </p>
            <p className="mt-1 font-mono t-xs text-steel-500">
              {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
            </p>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="py-4 text-center t-sm text-steel-500">
            {t('No incidents match the current filters.')}
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] t-sm">
          <thead>
            <tr className="border-b border-navy-700 text-left t-2xs uppercase tracking-[0.14em] text-steel-500">
              <th className="px-4 py-2">{t('Incident ID')}</th>
              <th className="px-4 py-2">{t('Occurred')}</th>
              <th className="px-4 py-2">{t('Area')}</th>
              <th className="px-4 py-2">{t('Category')}</th>
              <th className="px-4 py-2">{t('Status')}</th>
              <th className="px-4 py-2">{t('Description')}</th>
              <th className="px-4 py-2">{t('Location')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((incident) => (
              <tr key={incident.id} className="border-b border-navy-700/60 hover:bg-navy-800/40">
                <td className="px-4 py-1.5 font-mono t-xs text-steel-400">{incident.id}</td>
                <td className="px-4 py-1.5 text-steel-200">{formatDateTime(incident.occurredAt)}</td>
                <td className="px-4 py-1.5 text-steel-200">{incident.area}</td>
                <td className="px-4 py-1.5">
                  <CategoryBadge category={incident.category} />
                </td>
                <td className="px-4 py-1.5">
                  <StatusBadge status={incident.status} />
                </td>
                <td className="max-w-[360px] truncate px-4 py-1.5 text-steel-400">
                  {incident.description}
                </td>
                <td className="px-4 py-1.5 font-mono t-xs text-steel-500">
                  {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center t-sm text-steel-500">
                  {t('No incidents match the current filters.')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="border-t border-navy-700 px-4 py-2 t-xs text-steel-500">
        {t('Synthetic rows only - not a record of live police calls.')}
      </div>
    </Panel>
  )
}
