import { Crosshair, X } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { CRIME_CATEGORIES, RISK_LEVELS } from '../../types'
import {
  CRIME_FALLBACK_COLOR,
  CRIME_CATEGORY_COLORS,
  RISK_LEVEL_COLORS,
} from '../../utils/visuals'
import { crimeCategoryIcon } from '../../utils/crimeIcons'

const IncidentMarkerIcon = crimeCategoryIcon('Other')

/** Floating legend pinned to the map (categories, risk levels, station icon). */
export function MapLegend() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-auto absolute bottom-9 left-3 z-[1200]">
      {open ? (
        <div className="flex max-h-[calc(100dvh-6.5rem)] w-[min(18rem,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-navy-600 bg-navy-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-navy-700 px-2 py-1">
            <span className="inline-flex items-center gap-1 t-2xs font-bold uppercase tracking-[0.16em] text-steel-300">
              <Crosshair className="size-2.5 text-blue-400" aria-hidden />
              {t('Map legend')}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('Close legend')}
              className="rounded p-0.5 text-steel-400 hover:bg-navy-700 hover:text-steel-100"
            >
              <X className="size-2.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-2 overflow-y-auto px-2 py-1.5">
            <section>
              <p className="mb-1 t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
                {t('Crime category')}
              </p>
              <ul className="space-y-px">
                {CRIME_CATEGORIES.map((category) => {
                  const Icon = crimeCategoryIcon(category)
                  return (
                    <li
                      key={category}
                      className="flex items-center gap-1 t-2xs text-steel-200"
                    >
                      <span
                        className="grid size-3.5 shrink-0 place-items-center rounded-full border-2 border-white text-white shadow-sm"
                        style={{
                          backgroundColor:
                            CRIME_CATEGORY_COLORS[category] ?? CRIME_FALLBACK_COLOR,
                        }}
                      >
                        <Icon className="size-2.5" strokeWidth={2.25} aria-hidden />
                      </span>
                      {t('category.' + category)}
                    </li>
                  )
                })}
              </ul>
            </section>

            <section>
              <p className="mb-1 t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
                {t('Risk level')}
              </p>
              <ul className="space-y-px">
                {RISK_LEVELS.map((level) => (
                  <li
                    key={level}
                    className="flex items-center gap-1 t-2xs text-steel-200"
                  >
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full border-2"
                      style={{ borderColor: RISK_LEVEL_COLORS[level] }}
                    />
                    {t('{level} zone', { level: t('risk.' + level) })}
                  </li>
                ))}
              </ul>
            </section>

            <section className="col-span-2 mt-0.5 border-t border-navy-700 pt-1.5">
              <p className="mb-1 t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
                {t('Symbols')}
              </p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <li className="flex items-center gap-1 t-2xs text-steel-200">
                  <span className="police-marker scale-75" aria-hidden>
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2 4 5v6.2C4 17 7.6 21.4 12 22.6 16.4 21.4 20 17 20 11.2V5l-8-3z" />
                      <path
                        d="m12 7.2 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5 1.5-3z"
                        fill="#1d4ed8"
                      />
                    </svg>
                  </span>
                  {t('Police station')}
                </li>
                <li className="flex items-center gap-1 t-2xs text-steel-200">
                  <span
                    className="grid size-3.5 shrink-0 place-items-center rounded-full border-2 border-white text-white"
                    style={{ backgroundColor: CRIME_CATEGORY_COLORS.Other }}
                  >
                    <IncidentMarkerIcon className="size-2.5" strokeWidth={2.25} aria-hidden />
                  </span>
                  {t('Incident marker')}
                </li>
                <li className="flex items-center gap-1 t-2xs text-steel-200">
                  <span
                    className="inline-block h-0 w-3 border-t-2 border-dashed border-sky-400"
                    aria-hidden
                  />
                  {t('Puducherry boundary (city limits)')}
                </li>
                <li className="flex items-center gap-1 t-2xs text-steel-200">
                  <span className="inline-block size-2.5 rounded-full border border-dashed border-amber-400 bg-amber-400/20" />
                  {t('Risk zone (scored 0-100)')}
                </li>
                <li className="flex items-center gap-1 t-2xs text-steel-200">
                  <span
                    className="relative grid size-3.5 shrink-0 place-items-center rounded-full border-2 border-white text-white"
                    style={{ backgroundColor: CRIME_CATEGORY_COLORS.Other }}
                  >
                    <IncidentMarkerIcon className="size-2" strokeWidth={2.25} aria-hidden />
                    <span className="absolute -right-1.5 -top-1.5 grid h-2.5 min-w-2.5 place-items-center rounded-full border border-navy-500 bg-white px-[2px] t-2xs font-bold leading-none text-steel-100">
                      12
                    </span>
                  </span>
                  {t('Locality cluster (zoom out)')}
                </li>
                <li className="flex items-center gap-1 t-2xs text-steel-200">
                  <span className="patrol-marker scale-75" aria-hidden>
                    <svg viewBox="0 0 24 24">
                      <path d="M3 11 5 5h14l2 6v6h-3v-2H6v2H3v-6z" />
                      <circle cx="7.5" cy="15.5" r="1.6" fill="#0d1526" />
                      <circle cx="16.5" cy="15.5" r="1.6" fill="#0d1526" />
                    </svg>
                  </span>
                  {t('Simulated patrol unit')}
                </li>
              </ul>
            </section>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('Open map legend')}
          title={t('Map legend')}
          className="grid size-9 place-items-center rounded-full border border-navy-600 bg-navy-900/95 text-steel-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-colors hover:text-steel-100"
        >
          <Crosshair className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}