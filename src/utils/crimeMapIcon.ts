import L from 'leaflet'
import type { CrimeCategory, CrimeIncident } from '../types'
import { CRIME_CATEGORY_COLORS, CRIME_FALLBACK_COLOR } from './visuals'

/**
 * Tabler-style glyph identifier for each crime category.
 *
 * Colours are sourced from `CRIME_CATEGORY_COLORS` in `visuals.ts` so the map
 * pins stay in sync with the legend and charts. Kept in sync with the
 * `crimeSymbol` switch below.
 */
const CRIME_SYMBOLS: Record<CrimeCategory, string> = {
  Theft: 'wallet',
  Robbery: 'hand',
  Assault: 'shield',
  Burglary: 'house',
  'Vehicle Theft': 'car',
  Fraud: 'card',
  Other: 'file',
}

/** Shared stroke attributes applied to every white crime glyph. */
const SYMBOL_STROKE =
  'fill="none" stroke="white" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round"'

/** Raw inner SVG markup (32x32 viewBox) for a crime glyph. */
function crimeSymbol(symbol: string): string {
  switch (symbol) {
    case 'wallet':
      return (
        `<rect x="7" y="9" width="18" height="14" rx="3" ${SYMBOL_STROKE}/>` +
        `<path d="M7 12H22V18H7M18 15H18.1" ${SYMBOL_STROKE}/>`
      )
    case 'hand':
      return (
        `<path d="M9 14V8a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v7c0 4-3 6-7 6h-1c-3 0-5-2-6-5l-2-4a1.5 1.5 0 0 1 2.7-1.3L9 16" ${SYMBOL_STROKE}/>`
      )
    case 'shield':
      return (
        `<path d="M16 4 25 8V15C25 21 21 25 16 28 11 25 7 21 7 15V8Z" ${SYMBOL_STROKE}/>` +
        `<path d="m12 16 3 3 6-7" ${SYMBOL_STROKE}/>`
      )
    case 'house':
      return `<path d="m5 15 11-9 11 9M8 13v13h16V13M14 26v-8h5v8" ${SYMBOL_STROKE}/>`
    case 'car':
      return (
        `<path d="m5 17 2-7h18l2 7v7H5zM7 17h18M9 24v2m14-2v2M9 10l2-4h12l2 4" ${SYMBOL_STROKE}/>` +
        `<circle cx="10" cy="20" r="1" fill="white"/>` +
        `<circle cx="22" cy="20" r="1" fill="white"/>`
      )
    case 'card':
      return (
        `<rect x="5" y="8" width="22" height="16" rx="3" ${SYMBOL_STROKE}/>` +
        `<path d="M5 13h22M9 19h6" ${SYMBOL_STROKE}/>`
      )
    default:
      return (
        `<path d="M8 5h12l5 5v17H8zM20 5v6h5M12 15h8M12 19h5" ${SYMBOL_STROKE}/>` +
        `<path d="M16 23v.1" ${SYMBOL_STROKE}/>`
      )
  }
}

/**
 * Build the teardrop map pin for a crime category: a coloured pin (2px white
 * outline) with a white crime-type glyph centred in the head. The pin tip marks
 * the exact coordinate, so `iconAnchor` is the bottom tip and `popupAnchor`
 * opens above the head.
 */
export function createCrimeMapIcon(category: string, related = false): L.DivIcon {
  const color =
    CRIME_CATEGORY_COLORS[category as CrimeCategory] ?? CRIME_FALLBACK_COLOR
  const symbol = CRIME_SYMBOLS[category as CrimeCategory] ?? CRIME_SYMBOLS.Other
  const innerIcon = crimeSymbol(symbol)

  const html =
    `<div class="crime-pin${related ? ' crime-pin--related' : ''}" ` +
    `style="--crime-color:${color}">` +
    (related ? `<span class="crime-pin__halo"></span>` : '') +
    `<svg class="crime-pin__shape" xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 40 48" aria-hidden="true">` +
    `<path d="M20 46C16 39 2 26 2 17A18 18 0 1 1 38 17C38 26 24 39 20 46Z" ` +
    `fill="${color}" stroke="white" stroke-width="2" stroke-linejoin="round"/>` +
    `</svg>` +
    `<svg class="crime-pin__symbol" xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 32 32" aria-hidden="true">${innerIcon}</svg>` +
    `</div>`

  return L.divIcon({
    className: 'crime-pin-wrapper',
    html,
    iconSize: [32, 38],
    iconAnchor: [16, 36],
    popupAnchor: [0, -35],
    tooltipAnchor: [0, -32],
  })
}

/** Resolve the pin colour for a category, falling back to slate. */
export function getCrimeColor(category: string): string {
  return CRIME_CATEGORY_COLORS[category as CrimeCategory] ?? CRIME_FALLBACK_COLOR
}

/** Build the map pin for a single incident. */
export function getCrimeIcon(incident: CrimeIncident, related = false): L.DivIcon {
  return createCrimeMapIcon(incident.category, related)
}
