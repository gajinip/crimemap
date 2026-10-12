import { ChevronDown, MapPin } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Panel } from '../components/ui/Panel'
import { StationDetailPanel } from '../components/StationDetailPanel'
import { useI18n } from '../i18n/useI18n'
import type { CrimeIncident, PoliceStation } from '../types'

interface StationsViewProps {
  stations: PoliceStation[]
  incidents: CrimeIncident[]
  onFocusArea: (area: string) => void
}

export function StationsView({ stations, onFocusArea }: StationsViewProps) {
  const { t } = useI18n()
  // Clicking a station reveals its full detail card directly beneath the row,
  // so the operator never leaves the list to read contact / capacity facts.
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id))

  return (
    <div className="scroll-thin p-3 pb-6 xl:p-4">
      <Panel title={t('Police stations')} subtitle={t('Fictional demo locations for mapping only')}>
        {/* Mobile: tappable cards with an inline expandable detail card. */}
        <div className="space-y-2 md:hidden">
          {stations.map((station) => {
            const expanded = expandedId === station.id
            return (
              <div
                key={station.id}
                className="overflow-hidden rounded-lg border border-navy-700 bg-navy-800/60"
              >
                <button
                  type="button"
                  onClick={() => toggle(station.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-start justify-between gap-2 p-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block t-base font-semibold text-steel-100">
                      {station.name}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 t-sm text-steel-400">
                      <span className="inline-flex items-center gap-1 text-steel-200">
                        <MapPin className="size-3.5 text-blue-400" aria-hidden />
                        {station.area}
                      </span>
                      <span className="font-mono t-xs text-steel-500">
                        {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-0.5 size-4 shrink-0 text-steel-400 transition-transform ${
                      expanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>
                {expanded ? (
                  <div className="border-t border-navy-700 p-2.5">
                    <StationDetailPanel station={station} />
                    <button
                      type="button"
                      onClick={() => onFocusArea(station.area)}
                      className="mt-2 inline-flex items-center gap-1 t-xs font-semibold text-blue-400 hover:text-blue-600"
                    >
                      <MapPin className="size-3.5" /> {t('Show on map')}
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Desktop: table rows that reveal a full-width detail row beneath. */}
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
              {stations.map((station) => {
                const expanded = expandedId === station.id
                return (
                  <Fragment key={station.id}>
                    <tr className="border-b border-navy-700/60 hover:bg-navy-800/40">
                      <td className="px-4 py-1.5 font-mono t-xs text-steel-400">{station.id}</td>
                      <td className="px-4 py-1.5 text-steel-200">{station.name}</td>
                      <td className="px-4 py-1.5 text-steel-200">{station.area}</td>
                      <td className="max-w-[520px] px-4 py-1.5 text-steel-400">
                        {station.jurisdiction.join(', ')}
                      </td>
                      <td className="px-4 py-1.5 font-mono t-xs text-steel-500">
                        {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onFocusArea(station.area)}
                            className="inline-flex items-center gap-1 t-xs font-semibold text-blue-400 hover:text-blue-600"
                          >
                            <MapPin className="size-3.5" /> {t('Show on map')}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggle(station.id)}
                            aria-expanded={expanded}
                            className="inline-flex items-center gap-1 t-xs font-semibold text-steel-300 hover:text-steel-100"
                          >
                            <ChevronDown
                              className={`size-3.5 transition-transform ${
                                expanded ? 'rotate-180' : ''
                              }`}
                              aria-hidden
                            />
                            {expanded ? t('Hide details') : t('Details')}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-navy-700/60 bg-navy-800/30">
                        <td colSpan={6} className="px-4 py-3">
                          <StationDetailPanel station={station} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 t-xs text-steel-500">
          {t('Contact, capacity and status shown are fictional demo values.')}
        </div>
      </Panel>
    </div>
  )
}
