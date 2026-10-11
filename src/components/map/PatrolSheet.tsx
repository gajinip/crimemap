import { Navigation } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'
import { usePatrol } from '../../patrol/usePatrol'
import { DemoNotice, DetailSheet, SheetRow } from './DetailSheet'

const STATUS_COLORS: Record<string, string> = {
  Standby: '#94a3b8',
  Deploying: '#facc15',
  Patrolling: '#22c55e',
}

interface PatrolSheetProps {
  unitId: string
  onClose: () => void
}

/**
 * Bottom sheet shown when a simulated patrol unit marker is tapped. Reads the
 * live unit from the patrol context so status/ETA/position stay current.
 */
export function PatrolSheet({ unitId, onClose }: PatrolSheetProps) {
  const { t } = useI18n()
  const { units } = usePatrol()
  const unit = units.find((entry) => entry.id === unitId)

  if (!unit) return null

  const color = STATUS_COLORS[unit.displayStatus] ?? '#94a3b8'

  return (
    <DetailSheet
      ariaLabel={t('Patrol unit {callsign} details', { callsign: unit.callsign })}
      onClose={onClose}
      header={
        <>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 t-xs font-bold"
            style={{ color, borderColor: `${color}66` }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
            {t('patrol.' + unit.displayStatus)}
          </span>
          <h2 className="mt-1.5 truncate t-md font-semibold text-steel-100">
            {unit.callsign} &middot; {unit.id}
          </h2>
        </>
      }
    >
      <div className="rounded-xl border border-navy-600 bg-navy-800/70 px-2.5 py-1">
        <SheetRow label={t('Base station')} value={unit.stationName} />
        <SheetRow label={t('Assigned zone')} value={unit.zoneArea} />
        <SheetRow label={t('Status')} value={t('patrol.' + unit.displayStatus)} />
        <SheetRow
          label={t('ETA')}
          value={unit.etaMinutes > 0 ? t('{minutes} min', { minutes: unit.etaMinutes }) : t('On station')}
        />
        <SheetRow
          label={t('Coordinates')}
          value={`${unit.displayLat.toFixed(4)}, ${unit.displayLng.toFixed(4)}`}
          mono
        />
        <DemoNotice>{t('SIMULATED UNITS - NOT LIVE VEHICLE DATA')}</DemoNotice>
      </div>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${unit.displayLat},${unit.displayLng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 t-base font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <Navigation className="size-4" aria-hidden /> {t('Get directions')}
      </a>
    </DetailSheet>
  )
}
