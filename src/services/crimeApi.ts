import { CRIME_INCIDENTS } from '../data/crimeIncidents'
import { POLICE_STATIONS } from '../data/policeStations'
import type { CrimeIncident, PoliceStation } from '../types'

/**
 * Data access contract for CRIMEMAP.
 *
 * The UI only depends on this interface, so the bundled demo modules can be
 * replaced with an HTTP implementation backed by PostgreSQL + PostGIS +
 * FastAPI without changing any component:
 *
 *   const crimeDataSource: CrimeDataSource = httpCrimeDataSource('/api/v1')
 *
 * Risk zones are intentionally *not* part of this contract: they are derived
 * in the browser by the deterministic analytics engine in `src/analytics`,
 * so they always reflect the filters and date range currently on screen.
 * A future backend can serve pre-computed zones instead.
 */
export interface CrimeDataSource {
  fetchIncidents(): Promise<CrimeIncident[]>
  fetchStations(): Promise<PoliceStation[]>
}

/** Local, synchronous demo source backed by files in src/data/. */
export const localDemoCrimeSource: CrimeDataSource = {
  async fetchIncidents() {
    return CRIME_INCIDENTS.map((incident) => ({ ...incident }))
  },
  async fetchStations() {
    return POLICE_STATIONS.map((station) => ({ ...station }))
  },
}

/**
 * Reference implementation for the future REST backend.
 * Not wired up yet - kept so the swap is a one-line change.
 */
export function httpCrimeDataSource(baseUrl: string): CrimeDataSource {
  async function get<T>(path: string): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`CRIMEMAP API error ${response.status} on ${path}`)
    }
    return (await response.json()) as T
  }

  return {
    fetchIncidents: () => get<CrimeIncident[]>('/incidents'),
    fetchStations: () => get<PoliceStation[]>('/stations'),
  }
}

export const crimeDataSource: CrimeDataSource = localDemoCrimeSource
