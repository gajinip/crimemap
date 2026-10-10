import {
  CarFront,
  CreditCard,
  FileQuestionMark,
  Hand,
  House,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CrimeCategory } from '../types'

/**
 * Centralised crime-category -> icon mapping.
 *
 * The design spec references Tabler glyphs, but this project already ships
 * `lucide-react`; the visually equivalent, already-installed icons are used
 * here so no new dependency is introduced. Keep this map in sync with
 * `CRIME_CATEGORY_COLORS` in `visuals.ts`.
 */
export const CRIME_CATEGORY_ICONS: Record<CrimeCategory, LucideIcon> = {
  Theft: Wallet,
  Robbery: Hand,
  Assault: ShieldAlert,
  Burglary: House,
  'Vehicle Theft': CarFront,
  Fraud: CreditCard,
  Other: FileQuestionMark,
}

/** Generic glyph shown when a record carries an unknown category. */
export const CRIME_FALLBACK_ICON: LucideIcon = FileQuestionMark

/** Resolve the icon for a category, falling back to the generic glyph. */
export function crimeCategoryIcon(category: string): LucideIcon {
  return CRIME_CATEGORY_ICONS[category as CrimeCategory] ?? CRIME_FALLBACK_ICON
}

/**
 * Raw 24x24 SVG inner markup for each crime glyph, matching the lucide icon
 * paths above. Kept as data so Leaflet markers get their icon HTML without
 * pulling `react-dom/server` into the client bundle.
 */
const CRIME_GLYPH_PATHS: Record<CrimeCategory, string> = {
  Theft:
    '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"></path>' +
    '<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"></path>',
  Robbery:
    '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"></path>' +
    '<path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"></path>' +
    '<path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"></path>' +
    '<path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>',
  Assault:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>' +
    '<path d="M12 8v4"></path>' +
    '<path d="M12 16h.01"></path>',
  Burglary:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>' +
    '<path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
  'Vehicle Theft':
    '<path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"></path>' +
    '<path d="M7 14h.01"></path>' +
    '<path d="M17 14h.01"></path>' +
    '<rect width="18" height="8" x="3" y="10" rx="2"></rect>' +
    '<path d="M5 18v2"></path>' +
    '<path d="M19 18v2"></path>',
  Fraud:
    '<rect width="20" height="14" x="2" y="5" rx="2"></rect>' +
    '<line x1="2" x2="22" y1="10" y2="10"></line>' +
    '<path d="M6 14h2"></path>',
  Other:
    '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>' +
    '<path d="M12 17h.01"></path>' +
    '<path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"></path>',
}

/**
 * Render a crime icon to a raw SVG string so it can be embedded inside a
 * Leaflet `divIcon`. Colours default to a white glyph for map markers.
 */
export function crimeIconSvg(category: string, color = '#ffffff', size = 19): string {
  const glyph = CRIME_GLYPH_PATHS[category as CrimeCategory] ?? CRIME_GLYPH_PATHS.Other
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.25" ` +
    `stroke-linecap="round" stroke-linejoin="round" class="lucide" aria-hidden="true">` +
    glyph +
    `</svg>`
  )
}