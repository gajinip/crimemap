import { Navigation } from 'lucide-react'
import type { PoliceStation } from '../../types'
import { DemoNotice, DetailSheet, SheetRow } from './DetailSheet'

interface StationSheetProps {
  station: PoliceStation
  onClose: () => void
}

/** Bottom sheet shown when a police station marker is tapped. */
export function StationSheet({ station, onClose }: StationSheetProps) {
  return (
    <DetailSheet
      ariaLabel={`Police station ${station.name} details`}
      onClose={onClose}
      header={
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/60 px-2 py-0.5 text-[10px] font-bold text-blue-300">
            <span className="size-1.5 rounded-full bg-blue-400" aria-hidden />
            Police station
          </span>
          <h2 className="mt-1.5 truncate text-[14px] font-semibold text-white">
            {station.name}
          </h2>
        </>
      }
    >
      <div className="rounded-xl border border-navy-600 bg-navy-800/70 px-2.5 py-1">
        <SheetRow label="Station ID" value={station.id} />
        <SheetRow label="Locality" value={station.area} />
        <SheetRow label="Jurisdiction" value={station.jurisdiction.join(', ')} />
        <SheetRow
          label="Coordinates"
          value={`${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`}
          mono
        />
        <DemoNotice>DEMO DATA - NOT REAL STATION INFORMATION</DemoNotice>
      </div>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <Navigation className="size-4" aria-hidden /> Get directions
      </a>
    </DetailSheet>
  )
}
