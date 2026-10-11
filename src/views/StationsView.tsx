import { MapPin } from 'lucide-react'
import { Panel } from '../components/ui/Panel'
import { useI18n } from '../i18n/useI18n'
import type { CrimeIncident, PoliceStation } from '../types'

interface StationsViewProps {
  stations: PoliceStation[]
  incidents: CrimeIncident[]
  onFocusArea: (area: string) => void
}

export function StationsView({ stations, onFocusArea }: StationsViewProps) {
  const { t } = useI18n()

  return (
    <div className="scroll-thin p-3 pb-6 xl:p-4">
      <Panel title={t('Police stations')} subtitle={t('Fictional demo locations for mapping only')}>
        <div className="space-y-2 md:hidden">
          {stations.map((station) => (
            <div
              key={station.id}
              className="rounded-lg border border-navy-700 bg-navy-800/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="t-base font-semibold text-steel-100">{station.name}</span>
                <span className="shrink-0 font-mono t-xs text-steel-400">{station.id}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 t-sm text-steel-400">
                <span className="inline-flex items-center gap-1 text-steel-200">
                  <MapPin className="size-3.5 text-blue-400" aria-hidden />
                  {station.area}
                </span>
                <span className="font-mono t-xs text-steel-500">
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </span>
              </div>
              <p className="mt-1.5 t-sm leading-snug text-steel-400">
                {station.jurisdiction.join(', ')}
              </p>
              <button
                type="button"
                onClick={() => onFocusArea(station.area)}
                className="mt-2 inline-flex items-center gap-1 t-xs font-semibold text-blue-400 hover:text-blue-600"
              >
                <MapPin className="size-3.5" /> {t('Show on map')}
              </button>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] t-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left t-2xs uppercase tracking-[0.14em] text-steel-500">
                <th className="px-4 py-2">{t('Station ID')}</th>
                <th className="px-4 py-2">{t('Name')}</th>
                <th className="px-4 py-2">{t('Area')}</th>
                <th className="px-4 py-2">{t('Jurisdiction')}</th>
                <th className="px-4 py-2">{t('Coordinates')}</th>
                <th className="px-4 py-2">{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id} className="border-b border-navy-700/60 hover:bg-navy-800/40">
                  <td className="px-4 py-1.5 font-mono t-xs text-steel-400">{station.id}</td>
                  <td className="px-4 py-1.5 text-steel-200">{station.name}</td>
                  <td className="px-4 py-1.5 text-steel-200">{station.area}</td>
                  <td className="max-w-[520px] px-4 py-1.5 text-steel-400">{station.jurisdiction.join(', ')}</td>
                  <td className="px-4 py-1.5 font-mono t-xs text-steel-500">
                    {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-1.5">
                    <button
                      type="button"
                      onClick={() => onFocusArea(station.area)}
                      className="inline-flex items-center gap-1 t-xs font-semibold text-blue-400 hover:text-blue-600"
                    >
                      <MapPin className="size-3.5" /> {t('Show on map')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 t-xs text-steel-500">
          {t('No contact, capacity or operational status provided.')}
        </div>
      </Panel>
    </div>
  )
}

