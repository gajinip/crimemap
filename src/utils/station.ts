import type { PoliceStation } from '../types'

/**
 * DEMO firm-detail generator for police stations.
 *
 * The bundled station records carry only identity and location. So the
 * "station details" view is demonstrable, operational fields (officer in
 * charge, contact line, capacity, status) are derived deterministically from
 * the station id: the same station always shows the same profile. Everything
 * is clearly fictional and must not be treated as real police information.
 */

export type StationStatus = 'Operational' | 'Limited Hours' | 'Under Maintenance'

export interface StationDetails {
  officerInCharge: string
  rank: string
  phone: string
  email: string
  address: string
  capacity: number
  unitsAssigned: number
  status: StationStatus
  openedYear: number
}

const OFFICERS = [
  'Inspector R. Anand',
  'Inspector S. Priya',
  'Inspector M. Karthikeyan',
  'Inspector A. Vasanthi',
  'Inspector K. Rajkumar',
  'Inspector D. Elangovan',
  'Inspector P. Bhuvaneshwari',
  'Inspector N. Senthilnathan',
  'Inspector J. Lavanya',
  'Inspector V. Murugesan',
  'Inspector G. Deepa',
]

const RANKS = ['Inspector of Police', 'Sub-Inspector', 'Circle Inspector']

const STATUSES: StationStatus[] = ['Operational', 'Limited Hours', 'Under Maintenance']

/** Small stable string hash (FNV-1a), matching the offender generator. */
function hash(input: string): number {
  let value = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

/** Deterministic fictional operational profile for a station. */
export function stationDetails(station: PoliceStation): StationDetails {
  const seed = hash(station.id)
  const line = 2000 + (seed % 800)
  const extension = 1000 + ((seed >>> 7) % 9000)
  const slug = station.name
    .toLowerCase()
    .replace(/ police station$/, '')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^$/, 'station')

  return {
    officerInCharge: OFFICERS[seed % OFFICERS.length],
    rank: RANKS[(seed >>> 3) % RANKS.length],
    phone: `+91 413 ${line} ${String(extension).padStart(4, '0')}`,
    email: `${slug}.ps@demo-crimemap.invalid`,
    address: `${station.area} Main Road, Puducherry`,
    capacity: 20 + (seed % 61),
    unitsAssigned: 2 + ((seed >>> 5) % 7),
    status: STATUSES[(seed >>> 9) % STATUSES.length],
    openedYear: 1948 + (seed % 74),
  }
}
