import { MapPin } from 'lucide-react'
import { Panel } from '../components/ui/Panel'
import { DemoChip } from '../components/ui/Badge'
import type { CrimeIncident, PoliceStation } from '../types'

interface StationsViewProps {
  stations: PoliceStation[]
  incidents: CrimeIncident[]
  onFocusArea: (area: string) => void
}

export function StationsView({ stations, onFocusArea }: StationsViewProps) {
  return (
    <div className="scroll-thin p-3 pb-6 xl:p-4">
      <Panel title="Police stations" subtitle="Fictional demo locations for mapping only">
        <div className="space-y-2 md:hidden">
          {stations.map((station) => (
            <div
              key={station.id}
              className="rounded-lg border border-navy-700 bg-navy-800/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold text-steel-100">{station.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-steel-400">{station.id}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-steel-400">
                <span className="inline-flex items-center gap-1 text-steel-200">
                  <MapPin className="size-3.5 text-blue-400" aria-hidden />
                  {station.area}
                </span>
                <span className="font-mono text-[10px] text-steel-500">
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-steel-400">
                {station.jurisdiction.join(', ')}
              </p>
              <button
                type="button"
                onClick={() => onFocusArea(station.area)}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-600"
              >
                <MapPin className="size-3.5" /> Show on map
              </button>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-[11px]">
            <thead>
              <tr className="border-b border-navy-700 text-left text-[9px] uppercase tracking-[0.14em] text-steel-500">
                <th className="px-4 py-2">Station ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2">Jurisdiction</th>
                <th className="px-4 py-2">Coordinates</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id} className="border-b border-navy-700/60 hover:bg-navy-800/40">
                  <td className="px-4 py-1.5 font-mono text-[10px] text-steel-400">{station.id}</td>
                  <td className="px-4 py-1.5 text-steel-200">{station.name}</td>
                  <td className="px-4 py-1.5 text-steel-200">{station.area}</td>
                  <td className="max-w-[520px] px-4 py-1.5 text-steel-400">{station.jurisdiction.join(', ')}</td>
                  <td className="px-4 py-1.5 font-mono text-[10px] text-steel-500">
                    {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-1.5">
                    <button
                      type="button"
                      onClick={() => onFocusArea(station.area)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-600"
                    >
                      <MapPin className="size-3.5" /> Show on map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-[10px] text-steel-500">
          <DemoChip compact /> No contact, capacity or operational status provided.
        </div>
      </Panel>
    </div>
  )
}

