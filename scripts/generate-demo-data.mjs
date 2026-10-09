/**
 * Deterministic DEMO data generator for CRIMEMAP.
 *
 * Produces `src/data/crimeIncidents.ts` from a fixed seed so the dataset is
 * reproducible. Everything emitted is fictional sample data used for UI
 * development only - it does not describe real criminal activity.
 *
 * The dataset is shaped so the analytics engine has something realistic to
 * work with: an evening peak, per-locality momentum over the last 30 days,
 * one newly emerging locality and a few declining localities.
 *
 * Usage: node scripts/generate-demo-data.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = resolve(__dirname, '..', 'src', 'data', 'crimeIncidents.ts')
const BOUNDARY_FILE = resolve(__dirname, '..', 'src', 'data', 'puducherry-boundary.json')

/**
 * Puducherry district boundary (simplified OpenStreetMap relation, ODbL).
 * Used to guarantee every generated point lands on Puducherry land.
 */
const BOUNDARY = JSON.parse(readFileSync(BOUNDARY_FILE, 'utf8')).outer

function pointInsideBoundary(lng, lat) {
  let hit = false
  for (let i = 0, j = BOUNDARY.length - 1; i < BOUNDARY.length; j = i++) {
    const [xi, yi] = BOUNDARY[i]
    const [xj, yj] = BOUNDARY[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

function mulberry32(seed) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(20260408)

function gaussian() {
  const u = Math.max(random(), 1e-9)
  const v = Math.max(random(), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function pick(items) {
  return items[Math.floor(random() * items.length)]
}

function weightedPick(entries) {
  let total = 0
  for (const [, weight] of entries) total += weight
  const roll = random() * total
  let acc = 0
  for (const [value, weight] of entries) {
    acc += weight
    if (roll <= acc) return value
  }
  return entries[entries.length - 1][0]
}

/**
 * Approximate localities of the Puducherry union territory. Demo only.
 *
 * weight    relative share of the baseline dataset
 * momentum  extra incidents added inside the last 30 days (positive) or
 *           recent incidents removed to model a decline (negative)
 * surge     crime type pushed by the recent momentum
 * emerging  baseline incidents stop before the previous comparison window so
 *           the locality reads as a brand new hotspot
 */
const AREAS = [
  { name: 'Mission Street', lat: 11.9275, lng: 79.8325, spread: 0.0042, weight: 14, momentum: 8, surge: 'Theft' },
  { name: 'Muthialpet', lat: 11.9245, lng: 79.83, spread: 0.004, weight: 12, momentum: 6, surge: 'Vehicle Theft' },
  { name: 'Mudaliarpet', lat: 11.9178, lng: 79.8119, spread: 0.0045, weight: 11, momentum: 4, surge: 'Burglary' },
  { name: 'Lawspet', lat: 11.9545, lng: 79.833, spread: 0.005, weight: 9, momentum: 3, surge: 'Fraud' },
  { name: 'Solai Nagar', lat: 11.9561, lng: 79.8383, spread: 0.0045, weight: 9, momentum: 2, surge: 'Vehicle Theft' },
  { name: 'White Town', lat: 11.934, lng: 79.827, spread: 0.0045, weight: 8, momentum: -3, surge: 'Theft' },
  { name: 'Thattanchavady', lat: 11.9442, lng: 79.8061, spread: 0.005, weight: 8, momentum: 5, surge: 'Robbery' },
  { name: 'Oulgaret', lat: 11.957, lng: 79.813, spread: 0.005, weight: 8, momentum: -3, surge: 'Assault' },
  { name: 'Nellithope', lat: 11.9317, lng: 79.8105, spread: 0.005, weight: 7, momentum: -3, surge: 'Theft' },
  { name: 'Saram', lat: 11.9404, lng: 79.8145, spread: 0.004, weight: 7, momentum: -2, surge: 'Burglary' },
  { name: 'Nehru Street', lat: 11.9229, lng: 79.8113, spread: 0.0035, weight: 6, momentum: 1, surge: 'Theft' },
  { name: 'Orleanpet', lat: 11.942, lng: 79.8215, spread: 0.004, weight: 5, momentum: 0, surge: 'Other' },
  { name: 'Gorimedu', lat: 11.9535, lng: 79.7936, spread: 0.0045, weight: 4, momentum: 5, surge: 'Burglary', emerging: true },
  { name: 'Keezhmedu', lat: 11.9495, lng: 79.8245, spread: 0.004, weight: 4, momentum: 0, surge: 'Other' },
  { name: 'Isukapatti', lat: 11.9445, lng: 79.8145, spread: 0.004, weight: 3, momentum: 0, surge: 'Other' },
  { name: 'Ariyankuppam', lat: 11.8949, lng: 79.8076, spread: 0.005, weight: 3, momentum: 0, surge: 'Other' },
  { name: 'Villianur', lat: 11.9133, lng: 79.7551, spread: 0.005, weight: 3, momentum: 1, surge: 'Fraud' },
  { name: 'Kuruvinatham', lat: 11.952, lng: 79.7995, spread: 0.005, weight: 2, momentum: 0, surge: 'Other' },
  { name: 'Manakuppam', lat: 11.9185, lng: 79.8015, spread: 0.0045, weight: 2, momentum: 0, surge: 'Other' },
  { name: 'Bahour', lat: 11.9255, lng: 79.7765, spread: 0.005, weight: 2, momentum: 0, surge: 'Other' },
]

const CATEGORY_WEIGHTS = [
  ['Theft', 0.24],
  ['Vehicle Theft', 0.16],
  ['Assault', 0.13],
  ['Burglary', 0.11],
  ['Fraud', 0.11],
  ['Other', 0.17],
  ['Robbery', 0.08],
]

const STATUSES = [
  ['Reported', 0.3],
  ['Under Investigation', 0.3],
  ['Closed', 0.4],
]

/** Evening-heavy hourly distribution - produces a repeatable peak window. */
const HOUR_WEIGHTS = [
  1.4, 1.2, 1.0, 0.8, 0.8, 0.9, 1.1, 1.2, 1.2, 1.2, 1.2, 1.3,
  1.4, 1.4, 1.4, 1.5, 1.6, 1.8, 2.2, 2.8, 3.4, 3.6, 3.2, 2.2,
]

const HOUR_ENTRIES = HOUR_WEIGHTS.map((weight, hour) => [hour, weight])

const DESCRIPTIONS = {
  Theft: [
    'Pickpocketing complaint reported near the {area} retail stretch.',
    'Chain snatching attempt reported on a road in {area}.',
    'Shoplifting complaint filed at a store in {area}.',
  ],
  Robbery: [
    'Robbery complaint registered in the {area} precinct.',
    'Street robbery reported near a transit stop in {area}.',
    'Armed robbery reported at a commercial premise in {area}.',
  ],
  Assault: [
    'Assault incident reported at a public space in {area}.',
    'Altercation case registered near {area} junction.',
    'Physical altercation complaint filed in {area}.',
  ],
  Burglary: [
    'Break-in reported at a residence in {area}.',
    'Commercial burglary reported overnight in {area}.',
    'Forced entry complaint filed at a godown in {area}.',
  ],
  'Vehicle Theft': [
    'Two-wheeler theft reported from a parking area in {area}.',
    'Motorcycle theft case registered in {area}.',
    'Vehicle theft reported near a transit point in {area}.',
  ],
  Fraud: [
    'Cheating and financial fraud complaint filed in {area}.',
    'Digital payment fraud case registered in {area}.',
    'Defence of cheating reported by a trader in {area}.',
  ],
  Other: [
    'Miscellaneous offence reported in {area}.',
    'Public order complaint registered in {area}.',
    'Unclassified offence logged in {area}.',
  ],
}

const START_MS = Date.parse('2026-04-01T00:00:00Z')
const END_MS = Date.parse('2026-10-07T23:59:59Z')
/** Recent analysis window starts here (last 30 days of the dataset). */
const RECENT_MS = Date.parse('2026-09-08T00:00:00Z')
/** Previous analysis window starts here (30 days before RECENT_MS). */
const PREV_MS = Date.parse('2026-08-09T00:00:00Z')

const BASE_SCALE = 3.4

const pad = (value) => String(value).padStart(2, '0')

function randomTimestamp(fromMs, toMs) {
  return fromMs + Math.floor(random() * (toMs - fromMs))
}

function hourFor(eveningBias) {
  const entries = eveningBias
    ? HOUR_ENTRIES.map(([hour, weight]) => [hour, hour >= 19 && hour <= 23 ? weight * 1.7 : weight])
    : HOUR_ENTRIES
  return weightedPick(entries)
}

function makeRecord(area, fromMs, toMs, options = {}) {
  const category = options.category ?? weightedPick(CATEGORY_WEIGHTS)
  const status = weightedPick(STATUSES)
  const timestamp = randomTimestamp(fromMs, toMs)
  const date = new Date(timestamp)
  const day = date.toISOString().slice(0, 10)
  const hour = hourFor(options.eveningBias)
  const minute = Math.floor(random() * 60)
  const second = Math.floor(random() * 60)
  const spread = options.tightCluster ? area.spread * 0.55 : area.spread

  let lat = area.lat + gaussian() * spread
  let lng = area.lng + gaussian() * spread

  // Keep every point on Puducherry land: mirror the jitter about the area
  // centre until the point falls inside the district boundary. Consumes no
  // extra randomness, so the seeded record sequence stays reproducible.
  for (let attempt = 0; attempt < 14 && !pointInsideBoundary(lng, lat); attempt += 1) {
    lng = area.lng - (lng - area.lng) * 0.6
    lat = area.lat - (lat - area.lat) * 0.6
  }
  if (!pointInsideBoundary(lng, lat)) {
    lng = area.lng
    lat = area.lat
  }

  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    category,
    occurredAt: `${day}T${pad(hour)}:${pad(minute)}:${pad(second)}+05:30`,
    area: area.name,
    description: pick(DESCRIPTIONS[category]).replace('{area}', area.name),
    status,
    sortKey: timestamp,
  }
}

const incidents = []

for (const area of AREAS) {
  const base = Math.max(2, Math.round(area.weight * BASE_SCALE))
  const baselineEnd = area.emerging ? PREV_MS : END_MS

  for (let i = 0; i < base; i += 1) {
    incidents.push(makeRecord(area, START_MS, baselineEnd))
  }

  if (area.momentum > 0) {
    for (let i = 0; i < area.momentum; i += 1) {
      incidents.push(
        makeRecord(area, RECENT_MS, END_MS, { category: area.surge, tightCluster: true, eveningBias: true }),
      )
    }
  } else if (area.momentum < 0) {
    let remove = Math.abs(area.momentum)
    for (let i = incidents.length - 1; i >= 0 && remove > 0; i -= 1) {
      const record = incidents[i]
      if (record.area === area.name && record.sortKey >= RECENT_MS) {
        incidents.splice(i, 1)
        remove -= 1
      }
    }
  }
}

incidents.sort((a, b) => a.sortKey - b.sortKey)

const records = incidents.map((incident, index) => ({
  id: `CRM-2026-${String(index + 1).padStart(4, '0')}`,
  lat: incident.lat,
  lng: incident.lng,
  category: incident.category,
  occurredAt: incident.occurredAt,
  area: incident.area,
  description: incident.description,
  status: incident.status,
  isDemo: true,
}))

const lines = records.map((record) => {
  const escaped = record.description.replace(/'/g, "\\'")
  return [
    '  {',
    `    id: '${record.id}',`,
    `    lat: ${record.lat},`,
    `    lng: ${record.lng},`,
    `    category: '${record.category}',`,
    `    occurredAt: '${record.occurredAt}',`,
    `    area: '${record.area}',`,
    `    description: '${escaped}',`,
    `    status: '${record.status}',`,
    '    isDemo: true,',
    '  },',
  ].join('\n')
})

const output = `import type { CrimeIncident } from '../types'

/**
 * DEMO DATA - NOT REAL CRIME INFORMATION.
 *
 * Fictional incident records used to exercise the CRIMEMAP interface.
 * Regenerate with: node scripts/generate-demo-data.mjs
 * A future backend (PostgreSQL + PostGIS + FastAPI) will replace this module.
 */
export const CRIME_INCIDENTS: CrimeIncident[] = [
${lines.join('\n')}
]

export const DEMO_DATA_NOTICE =
  'All incidents shown in CRIMEMAP are synthetic demo records. They do not represent real criminal activity, real victims or real police reports.'
`

mkdirSync(dirname(OUT_FILE), { recursive: true })
writeFileSync(OUT_FILE, output, 'utf8')

const recent = records.filter((record) => Date.parse(record.occurredAt) >= RECENT_MS)
const previous = records.filter(
  (record) => Date.parse(record.occurredAt) >= PREV_MS && Date.parse(record.occurredAt) < RECENT_MS,
)
const byArea = records.reduce((acc, record) => {
  acc[record.area] = (acc[record.area] ?? 0) + 1
  return acc
}, {})

console.log(`Wrote ${records.length} demo incidents -> src/data/crimeIncidents.ts`)
console.log(`Recent window: ${recent.length} | Previous window: ${previous.length}`)
console.log(byArea)
