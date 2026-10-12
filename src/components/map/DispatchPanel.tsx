import { CheckCircle2, Radio, Siren } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { CrimeIncident } from '../../types'
import type { NearbyOfficer } from '../../utils/dispatch'
import { incidentSeverity } from '../../utils/dispatch'
import { RISK_LEVEL_COLOR } from '../../utils/riskPalette'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { Sheet } from '../ui/Sheet'

interface DispatchPanelProps {
  incident: CrimeIncident
  officers: NearbyOfficer[]
  radiusMeters: number
  onClose: () => void
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

/**
 * Immediate-action dispatch panel shown when a critical incident is reported.
 *
 * It resolves the patrol officers currently within the response radius and lets
 * the operator raise an alert to them. This is a local, simulated workflow: no
 * message leaves the app unless an authorised dispatch channel is configured.
 */
export function DispatchPanel({ incident, officers, radiusMeters, onClose }: DispatchPanelProps) {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const severity = incidentSeverity(incident)
  const accent = RISK_LEVEL_COLOR[severity]
  const radiusLabel = formatDistance(radiusMeters)

  return (
    <Sheet
      ariaLabel={t('Immediate action required')}
      onClose={onClose}
      header={
        <div className="flex items-center gap-2">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${accent}1f`, color: accent }}
          >
            <Siren className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-[1px] t-2xs font-bold uppercase tracking-[0.1em]"
              style={{ color: accent, backgroundColor: `${accent}1f` }}
            >
              {t('Critical')}
            </span>
            <h2 className="mt-0.5 t-base font-bold text-steel-100">
              {t('Immediate action required')}
            </h2>
          </div>
        </div>
      }
    >
      <p className="rounded-lg border px-3 py-2.5 t-sm leading-relaxed" style={{ borderColor: `${accent}66`, backgroundColor: `${accent}12`, color: 'var(--color-steel-100)' }}>
        {t(
          'A new {category} incident was reported in {area} and is flagged for immediate action.',
          { category: t('category.' + incident.category), area: incident.area },
        )}
      </p>

      <dl className="mt-3 grid grid-cols-1 gap-1 t-xs text-steel-400">
        <div className="flex justify-between gap-3">
          <dt>{t('Reference')}</dt>
          <dd className="font-mono font-semibold text-steel-200">{incident.id}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t('Category')}</dt>
          <dd className="inline-flex items-center gap-1.5 font-medium text-steel-200">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: CRIME_CATEGORY_COLORS[incident.category] }}
              aria-hidden
            />
            {t('category.' + incident.category)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t('Reported')}</dt>
          <dd className="font-medium text-steel-200">
            {timeFormatter.format(new Date(incident.occurredAt))}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t('Verified location')}</dt>
          <dd className="text-right font-medium text-steel-200">
            {incident.area}
            <span className="ml-1 font-mono text-steel-400">
              {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="inline-flex items-center gap-1.5 t-xs font-bold uppercase tracking-[0.12em] text-steel-400">
            <Radio className="size-3.5" aria-hidden />
            {t('Nearby officers')}
          </h3>
          <span className="t-xs text-steel-400">{t('within {radius}', { radius: radiusLabel })}</span>
        </div>

        {officers.length === 0 ? (
          <p className="mt-2 rounded-lg border border-navy-700 bg-navy-800 px-3 py-3 t-sm text-steel-400">
            {t('No patrol officers within {radius}. Widen the radius or alert the nearest station.', {
              radius: radiusLabel,
            })}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {officers.map(({ unit, distanceMeters }) => (
              <li
                key={unit.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 t-base font-semibold text-steel-100">
                    <span className="font-mono">{unit.callsign}</span>
                    <span className="rounded-full bg-navy-700 px-1.5 py-px t-2xs font-semibold uppercase tracking-[0.08em] text-steel-300">
                      {t('status.' + unit.displayStatus)}
                    </span>
                  </p>
                  <p className="truncate t-xs text-steel-400">{t(unit.stationName)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono t-sm font-semibold text-steel-100">
                    {formatDistance(distanceMeters)}
                  </p>
                  <p className="t-2xs text-steel-400">
                    {t('ETA {minutes} min', { minutes: Math.round(unit.etaMinutes) })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sent ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-risk-low/40 bg-risk-low/10 px-3 py-2.5 t-sm text-risk-low">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {t('Alert queued to {count} officers (simulated).', { count: officers.length })}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSent(true)}
          disabled={sent || officers.length === 0}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-risk-critical px-3 py-2 t-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Siren className="size-4" aria-hidden />
          {sent
            ? t('Alert sent')
            : t('Send alert to {count} officers', { count: officers.length })}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 t-base font-semibold text-steel-300 transition-colors hover:bg-hover hover:text-steel-100"
        >
          {t('Close')}
        </button>
      </div>

      <p className="mt-3 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 t-2xs leading-relaxed text-steel-400">
        {t(
          'Simulated dispatch. No message is transmitted to a police unit unless an authorised backend and communication channel are configured.',
        )}
      </p>
    </Sheet>
  )
}
