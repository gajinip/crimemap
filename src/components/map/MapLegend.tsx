import { ChevronDown, Crosshair } from 'lucide-react'
import { useState } from 'react'
import { CRIME_CATEGORIES, RISK_LEVELS } from '../../types'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS } from '../../utils/visuals'
import { DemoChip } from '../ui/Badge'

/** Floating legend pinned to the map (categories, risk levels, station icon). */
export function MapLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-auto absolute bottom-9 left-3 z-[1200] w-52 max-w-[calc(100vw-24px)] rounded-lg border border-navy-600 bg-navy-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-steel-300"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-1.5">
          <Crosshair className="size-3.5 text-blue-400" aria-hidden />
          Map legend
        </span>
        <ChevronDown
          className={`size-3.5 text-steel-400 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-navy-700 px-3 py-2.5">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            Crime category
          </p>
          <ul className="space-y-1">
            {CRIME_CATEGORIES.map((category) => (
              <li key={category} className="flex items-center gap-2 text-[10px] text-steel-200">
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full ring-1 ring-navy-950"
                  style={{ backgroundColor: CRIME_CATEGORY_COLORS[category] }}
                />
                {category}
              </li>
            ))}
          </ul>

          <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            Risk level
          </p>
          <ul className="space-y-1">
            {RISK_LEVELS.map((level) => (
              <li key={level} className="flex items-center gap-2 text-[10px] text-steel-200">
                <span
                  className="inline-block size-3 shrink-0 rounded-full border-2"
                  style={{ borderColor: RISK_LEVEL_COLORS[level] }}
                />
                {level} zone
              </li>
            ))}
          </ul>

          <p className="mb-1.5 mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            Symbols
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-[10px] text-steel-200">
              <span className="police-marker scale-75" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2 4 5v6.2C4 17 7.6 21.4 12 22.6 16.4 21.4 20 17 20 11.2V5l-8-3z" />
                  <path d="m12 7.2 1.5 3 3.3.5-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.5 1.5-3z" fill="#1d4ed8" />
                </svg>
              </span>
              Police station
            </li>
            <li className="flex items-center gap-2 text-[10px] text-steel-200">
              <span className="inline-block size-3 rounded-full border-2 border-navy-950 bg-sky-400" />
              Incident marker
            </li>
            <li className="flex items-center gap-2 text-[10px] text-steel-200">
              <span
                className="inline-block h-0 w-4 border-t-2 border-dashed border-sky-400"
                aria-hidden
              />
              Puducherry boundary (city limits)
            </li>
            <li className="flex items-center gap-2 text-[10px] text-steel-200">
              <span className="inline-block size-3 rounded-full border border-dashed border-amber-400 bg-amber-400/20" />
              Risk zone (scored 0-100)
            </li>
            <li className="flex items-center gap-2 text-[10px] text-steel-200">
              <span className="grid size-4 place-items-center rounded-full bg-navy-700 text-[7px] font-bold text-white ring-1 ring-navy-500">
                12
              </span>
              Locality cluster (zoom out)
            </li>
            <li className="flex items-center gap-2 text-[10px] text-steel-200">
              <span className="patrol-marker scale-90" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M3 11 5 5h14l2 6v6h-3v-2H6v2H3v-6z" />
                  <circle cx="7.5" cy="15.5" r="1.6" fill="#050a14" />
                  <circle cx="16.5" cy="15.5" r="1.6" fill="#050a14" />
                </svg>
                <b>PCR-1</b>
              </span>
              Simulated patrol unit
            </li>
          </ul>

          <div className="mt-3 border-t border-navy-700 pt-2">
            <DemoChip />
          </div>
        </div>
      ) : null}
    </div>
  )
}
