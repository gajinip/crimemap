import { useI18n } from '../../i18n/useI18n'
import type { PoliceStation } from '../../types'
import { StationDetailPanel } from '../StationDetailPanel'
import { DetailSheet } from './DetailSheet'

interface StationSheetProps {
  station: PoliceStation
  onClose: () => void
}

/** Detail panel (bottom sheet on mobile, right drawer on desktop) shown when a police station marker is tapped. */
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
      {/* Full contact / capacity / status card, shared with the Stations page. */}
      <StationDetailPanel station={station} />
    </DetailSheet>
  )
}
