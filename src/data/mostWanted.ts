import type { CrimeCategory, OffenderStatus, RiskLevel } from '../types'

/** A single most-wanted suspect shown on the dashboard. */
export interface MostWantedEntry {
  id: string
  name: string
  alias: string | null
  age: number | null
  /** Lead offence the person is wanted for. */
  crime: CrimeCategory
  lastSeenArea: string
  lastSeenAt: string
  riskLevel: RiskLevel
  /** Advertised reward in INR (0 = none). */
  reward: number
  status: OffenderStatus
  description: string
  isDemo: true
}

/**
 * DEMO DATA - NOT REAL CRIME INFORMATION.
 *
 * Fictional most-wanted entries used to exercise the dashboard interface.
 * A live system would populate this from the case-management backend.
 */
export const MOST_WANTED: MostWantedEntry[] = [
  {
    id: 'MW-2026-0451',
    name: 'D. Karthik',
    alias: 'Cobra',
    age: 34,
    crime: 'Robbery',
    lastSeenArea: 'Saram',
    lastSeenAt: '2026-09-28',
    riskLevel: 'Critical',
    reward: 25000,
    status: 'Wanted',
    description: 'Linked to a series of armed robberies at commercial premises.',
    isDemo: true,
  },
  {
    id: 'MW-2026-0388',
    name: 'M. Balamurugan',
    alias: 'Ghost',
    age: 29,
    crime: 'Burglary',
    lastSeenArea: 'Thattanchavady',
    lastSeenAt: '2026-09-21',
    riskLevel: 'High',
    reward: 15000,
    status: 'Wanted',
    description: 'Suspected in multiple night-time house break-ins.',
    isDemo: true,
  },
  {
    id: 'MW-2026-0402',
    name: 'F. Vijay',
    alias: null,
    age: 41,
    crime: 'Fraud',
    lastSeenArea: 'White Town',
    lastSeenAt: '2026-09-30',
    riskLevel: 'High',
    reward: 20000,
    status: 'Under Investigation',
    description: 'Alleged organiser of a digital-payment fraud network.',
    isDemo: true,
  },
  {
    id: 'MW-2026-0330',
    name: 'S. Murugan',
    alias: 'Bullet',
    age: 37,
    crime: 'Assault',
    lastSeenArea: 'Muthialpet',
    lastSeenAt: '2026-09-12',
    riskLevel: 'High',
    reward: 10000,
    status: 'Wanted',
    description: 'Wanted in connection with a public-order assault case.',
    isDemo: true,
  },
  {
    id: 'MW-2026-0307',
    name: 'N. Vignesh',
    alias: 'Tiger',
    age: 26,
    crime: 'Vehicle Theft',
    lastSeenArea: 'Lawspet',
    lastSeenAt: '2026-09-05',
    riskLevel: 'Medium',
    reward: 5000,
    status: 'Wanted',
    description: 'Suspected of operating a two-wheeler theft ring.',
    isDemo: true,
  },
  {
    id: 'MW-2026-0271',
    name: 'H. Ramesh',
    alias: null,
    age: 45,
    crime: 'Theft',
    lastSeenArea: 'Mudaliarpet',
    lastSeenAt: '2026-08-29',
    riskLevel: 'Medium',
    reward: 0,
    status: 'Arrested',
    description: 'Repeat offender, recently taken into custody.',
    isDemo: true,
  },
]
