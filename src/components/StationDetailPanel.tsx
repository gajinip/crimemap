import { Building2, Mail, MapPin, Navigation, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { PoliceStation } from '../types'
import { stationDetails } from '../utils/station'

interface StationDetailPanelProps {
  station: PoliceStation
  /** Extra classes for the outer card (e.g. spacing on the stations page). */
  className?: string
}

/**
 * Shared police-station detail card.
 *
 * Used both by the map station sheet (tap a station pin) and the Police
 * Stations page (expand a row). Every value is fictional demo data produced by
 * `stationDetails`, so it always carries the "not real" notice.
 */
export function StationDetailPanel({ station, className = '' }: StationDetailPanelProps) {
  const { t } = useI18n()
  const details = stationDetails(station)

  const facts: { label: string; value: string; icon: typeof UserRound; mono?: boolean }[] = [
    {
      label: t('Officer in charge'),
      value: `${details.officerInCharge} · ${details.rank}`,
      icon: UserRound,
    },
    { label: t('Contact'), value: details.phone, icon: Phone, mono: true },
    { label: t('Email'), value: details.email, icon: Mail, mono: true },
    { label: t('Address'), value: details.address, icon: MapPin },
    { label: t('Jurisdiction'), value: station.jurisdiction.join(', '), icon: Building2 },
    {
      label: t('Capacity'),
      value: t('{count} personnel', { count: details.capacity }),
      icon: ShieldCheck,
    },
    { label: t('Status'), value: t(details.status), icon: ShieldCheck },
    {
      label: t('Coordinates'),
      value: `${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`,
      icon: MapPin,
      mono: true,
    },
  ]

  return (
    <div className={`rounded-xl border border-navy-600 bg-navy-800/70 p-2.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-navy-700 pb-2">
        <span className="font-mono t-xs text-steel-500">{station.id}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/15 px-2 py-0.5 t-xs font-semibold text-blue-700">
          <Building2 className="size-3" aria-hidden />
          {station.area}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 t-xs font-semibold ${
            details.status === 'Operational'
              ? 'bg-risk-low/15 text-risk-low'
              : details.status === 'Limited Hours'
                ? 'bg-risk-medium/15 text-risk-medium'
                : 'bg-risk-critical/15 text-risk-critical'
          }`}
        >
          {t(details.status)}
        </span>
      </div>

      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {facts.map((fact) => {
          const Icon = fact.icon
          return (
            <div key={fact.label} className="min-w-0">
              <dt className="flex items-center gap-1.5 t-2xs font-bold uppercase tracking-[0.1em] text-steel-500">
                <Icon className="size-3 shrink-0" aria-hidden />
                {fact.label}
              </dt>
              <dd className={`mt-0.5 break-words t-sm text-steel-100${fact.mono ? ' font-mono t-xs' : ''}`}>
                {fact.value}
              </dd>
            </div>
          )
        })}
      </dl>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 t-base font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <Navigation className="size-4" aria-hidden /> {t('Get directions')}
      </a>

      <p className="mt-2 text-center t-2xs font-bold uppercase tracking-[0.08em] text-amber-700">
        {t('DEMO DATA - NOT REAL STATION INFORMATION')}
      </p>
    </div>
  )
}
