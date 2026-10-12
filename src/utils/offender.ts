import type { CrimeIncident, IncidentOffender, OffenderGender, OffenderStatus } from '../types'

/**
 * Deterministic demo offender profiles.
 *
 * The bundled dataset records incidents only, with no suspect rows. So that the
 * "person involved" feature is demonstrable, a stable profile is derived from
 * the incident id (same id always yields the same profile). Profiles are
 * clearly labelled demo data; operator-entered offenders are returned verbatim,
 * and roughly half of demo records intentionally return null to reflect that
 * suspect details are only shown "when available".
 */

const DEMO_NAMES = [
  'R. Kumar',
  'S. Murugan',
  'A. Rajendran',
  'V. Selvam',
  'P. Anbarasan',
  'K. Suresh',
  'M. Balamurugan',
  'D. Karthik',
  'J. Prakash',
  'N. Vignesh',
  'G. Senthil',
  'T. Arul',
  'B. Manikandan',
  'E. Saravanan',
  'L. Dinesh',
  'H. Ramesh',
  'C. Elango',
  'F. Vijay',
  'S. Ganesh',
  'K. Priya',
  'M. Lakshmi',
  'R. Bharathi',
]

const ALIASES = ['Bullet', 'Shadow', 'Cobra', 'Ghost', 'Tiger', 'Falcon', 'Viper', 'Scorpion']

const GENDERS: OffenderGender[] = ['Male', 'Female', 'Other', 'Unknown']

const STATUSES: OffenderStatus[] = ['Wanted', 'Arrested', 'Under Investigation', 'Unknown']

/** Small, fast, stable string hash (FNV-1a). */
function hash(input: string): number {
  let value = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

/**
 * Offender details for an incident, or null when none are on record.
 * Operator-entered data wins; otherwise a deterministic demo profile is derived.
 */
export function offenderFor(incident: CrimeIncident): IncidentOffender | null {
  if (incident.offender) return incident.offender
  if (!incident.isDemo) return null

  const seed = hash(incident.id)
  // Only some records have a suspect on file, mirroring real-world coverage.
  if (seed % 2 === 0) return null

  return {
    name: DEMO_NAMES[seed % DEMO_NAMES.length],
    alias: seed % 3 === 0 ? ALIASES[seed % ALIASES.length] : null,
    age: 20 + ((seed >>> 7) % 30),
    gender: GENDERS[(seed >>> 3) % GENDERS.length],
    status: STATUSES[(seed >>> 5) % STATUSES.length],
    description: 'Demo suspect profile generated for interface demonstration only.',
    isDemo: true,
  }
}
