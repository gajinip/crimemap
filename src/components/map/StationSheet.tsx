import { Navigation } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'
import type { PoliceStation } from '../../types'
import { DemoNotice, DetailSheet, SheetRow } from './DetailSheet'

interface StationSheetProps {
  station: PoliceStation
  onClose: () => void
}

/** Bottom sheet shown when a police station marker is tapped. */
export function StationSheet({ station, onClose }: StationSheetProps) {
  const { t } = useI18n()

  return (
    <DetailSheet
      ariaLabel={t('Police station {name} details', { name: station.name })}
      onClose={onClose}
      header={
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/60 px-2 py-0.5 t-xs font-bold text-blue-700">
            <span className="size-1.5 rounded-full bg-blue-400" aria-hidden />
            {t('Police station')}
          </span>
          <h2 className="mt-1.5 truncate t-md font-semibold text-steel-100">
            {station.name}
          </h2>
        </>
      }
    >
      <div className="rounded-xl border border-navy-600 bg-navy-800/70 px-2.5 py-1">
        <SheetRow label={t('Station ID')} value={station.id} />
        <SheetRow label={t('Locality')} value={station.area} />
        <SheetRow label={t('Jurisdiction')} value={station.jurisdiction.join(', ')} />
        <SheetRow
          label={t('Coordinates')}
          value={`${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`}
          mono
        />
        <DemoNotice>{t('DEMO DATA - NOT REAL STATION INFORMATION')}</DemoNotice>
      </div>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 t-base font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <Navigation className="size-4" aria-hidden /> {t('Get directions')}
      </a>
    </DetailSheet>
  )
}
