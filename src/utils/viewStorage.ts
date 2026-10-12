import type { AppView } from '../types'

/**
 * Persists the last-visited top-level view so a browser refresh keeps the user
 * on the same page instead of dropping them back to the crime map.
 *
 * Stored in localStorage (per browser, not per tab) and validated on read so a
 * stale or hand-edited value can never point at a view that no longer exists.
 */
const STORAGE_KEY = 'crimemap.view'

const VIEW_IDS: AppView[] = [
  'dashboard',
  'map',
  'hotspots',
  'trends',
  'intelligence',
  'predictive-risk',
  'patrol',
  'stations',
  'reports',
]

/** Last visited view, or the map as the safe default. */
export function readView(): AppView {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && (VIEW_IDS as string[]).includes(stored)) return stored as AppView
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return 'map'
}

/** Remember the current view so a refresh can restore it. */
export function writeView(view: AppView): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, view)
  } catch {
    /* ignore persistence failures (private mode, quota) */
  }
}
