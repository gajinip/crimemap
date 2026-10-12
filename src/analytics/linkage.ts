import type {
  AnalysisWindow,
  CrimeCategory,
  CrimeIncident,
  IncidentLink,
  LinkAnalysisResult,
  LinkCluster,
  LinkFeature,
  LinkFeatureKey,
  RepeatSuspect,
} from '../types'
import { offenderFor } from '../utils/offender'
import { distanceMeters } from '../utils/relatedIncidents'
import { hourOf } from './risk'

/**
 * Explainable crime-linkage model.
 *
 * This is the "relationship engine" behind the Crime Link Analysis panel. For
 * every pair of incidents it measures how strongly they belong to the same
 * event chain - the same person, the same area, the same crime type, the same
 * method and a close-in-time/space signature - then reports the association as
 * a 0-100 score with each contributing reason itemised.
 *
 * It is deliberately a *transparent, deterministic* model, in keeping with the
 * rest of the engine: it is a weighted similarity function over hand-picked
 * features, not a trained/opaque network. The same incidents always produce the
 * same links, which is what an analyst needs when justifying a lead. It answers
 * "which recorded crimes look related - past and present" and never asserts
 * that two incidents share an offender unless the records actually name the
 * same person.
 *
 * Features (weights, renormalised over the features that apply to a pair):
 *   offender   same suspect named on both records       0.34
 *   proximity  how close the two locations are          0.18
 *   category   same crime type                          0.16
 *   time       how close the two reported times are     0.12
 *   mo         description / modus-operandi similarity  0.08
 *   area       same locality                            0.06
 *   timeOfDay  similarity of the hour of day            0.04
 *   window     one in the recent window, one before it  0.02
 */

export const LINKAGE_MODEL_VERSION = 'crimemap-linkage-v1'

/** Geographic ceiling for a spatial link (metres). */
export const LINK_MAX_DISTANCE_M = 2000
/** Temporal ceiling for a temporal link (hours). */
export const LINK_MAX_HOURS = 24 * 7
/** Minimum 0-100 score before a pair is reported as linked. */
export const LINK_MIN_SCORE = 55
/** Score at which a link is upgraded from "moderate" to "strong". */
export const LINK_STRONG_SCORE = 75

const WEIGHTS: Record<LinkFeatureKey, number> = {
  offender: 0.34,
  proximity: 0.18,
  category: 0.16,
  time: 0.12,
  mo: 0.08,
  area: 0.06,
  timeOfDay: 0.04,
  window: 0.02,
}

const FEATURE_LABEL: Record<LinkFeatureKey, string> = {
  offender: 'Same suspect',
  proximity: 'Geographic proximity',
  category: 'Same crime type',
  time: 'Temporal proximity',
  mo: 'Similar method',
  area: 'Same locality',
  timeOfDay: 'Similar time of day',
  window: 'Past linked to present',
}

const MS_PER_HOUR = 60 * 60 * 1000

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'by', 'for',
  'with', 'from', 'into', 'near', 'case', 'filed', 'registered', 'reported',
  'complaint', 'incident', 'was', 'were', 'is', 'are', 'this', 'that', 'has',
])

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/** Stable pair key so a pair is only ever scored once. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/** Distinct, meaningful words in an incident description (for MO similarity). */
function tokenise(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  return new Set(words)
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const word of a) if (b.has(word)) intersection += 1
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** 1 for identical midnight-agnostic hours, falling to 0 twelve hours apart. */
function hourSimilarity(a: number, b: number): number {
  const diff = Math.abs(a - b)
  const circular = Math.min(diff, 24 - diff)
  return clamp01(1 - circular / 12)
}

function strengthLabel(score: number): IncidentLink['strength'] {
  if (score >= LINK_STRONG_SCORE) return 'strong'
  if (score >= LINK_MIN_SCORE + 15) return 'moderate'
  return 'weak'
}

/** Pre-computed, per-incident features reused across every pair. */
interface Prepared {
  incident: CrimeIncident
  timeMs: number
  hour: number
  tokens: Set<string>
  offender: string | null
  /** True when the suspect is operator-entered, not a generated demo profile. */
  offenderConfirmed: boolean
}

function prepare(incident: CrimeIncident): Prepared {
  const offender = offenderFor(incident)
  return {
    incident,
    timeMs: new Date(incident.occurredAt).getTime(),
    hour: hourOf(incident),
    tokens: tokenise(`${incident.description} ${incident.caseNotes ?? ''}`),
    offender: offender ? offender.name.trim().toLowerCase() : null,
    offenderConfirmed: offender ? !offender.isDemo : false,
  }
}

interface RawFeature {
  key: LinkFeatureKey
  strength: number
  detail: string
}

/**
 * Scores a prepared pair. Returns null when the pair fails the hard linking
 * gate (no shared suspect and neither close in space nor time).
 */
function scorePair(
  a: Prepared,
  b: Prepared,
  inRecent: ((timeMs: number) => number) | null,
): IncidentLink | null {
  const distance = distanceMeters(a.incident, b.incident)
  const hours = Math.abs(a.timeMs - b.timeMs) / MS_PER_HOUR
  const sameCategory = a.incident.category === b.incident.category
  const sameArea = a.incident.area === b.incident.area

  const samePerson = a.offender !== null && a.offender === b.offender
  const sharedOffender = samePerson ? a.offender : null
  // Only an operator-confirmed suspect on *both* records can tie incidents
  // together without a supporting time/space signature. A generated demo
  // profile still needs that support, so demo names never blow the graph up.
  const confirmedSamePerson =
    samePerson && a.offenderConfirmed && b.offenderConfirmed
  const withinSpaceTime =
    distance <= LINK_MAX_DISTANCE_M && hours <= LINK_MAX_HOURS

  // A link must be either the same confirmed person, or genuinely close in
  // both time and space. Everything else is noise.
  if (!confirmedSamePerson && !withinSpaceTime) return null

  const crossWindow = inRecent ? inRecent(a.timeMs) !== inRecent(b.timeMs) : false

  const raw: RawFeature[] = [
    {
      key: 'category',
      strength: sameCategory ? 1 : 0,
      detail: sameCategory
        ? `Both ${a.incident.category}`
        : `${a.incident.category} vs ${b.incident.category}`,
    },
    {
      key: 'area',
      strength: sameArea ? 1 : 0,
      detail: sameArea ? `Both in ${a.incident.area}` : `${a.incident.area} vs ${b.incident.area}`,
    },
    {
      key: 'proximity',
      strength: clamp01(1 - distance / LINK_MAX_DISTANCE_M),
      detail: `${(distance / 1000).toFixed(1)} km apart`,
    },
    {
      key: 'time',
      strength: clamp01(1 - hours / LINK_MAX_HOURS),
      detail:
        hours < 1
          ? 'Within the hour'
          : `${hours < 48 ? `${Math.round(hours)} h` : `${(hours / 24).toFixed(1)} days`} apart`,
    },
    {
      key: 'mo',
      strength: jaccard(a.tokens, b.tokens),
      detail: 'Description wording overlap',
    },
    {
      key: 'timeOfDay',
      strength: hourSimilarity(a.hour, b.hour),
      detail: `${String(a.hour).padStart(2, '0')}:00 vs ${String(b.hour).padStart(2, '0')}:00`,
    },
  ]

  if (a.offender !== null && b.offender !== null) {
    raw.push({
      key: 'offender',
      strength: samePerson ? 1 : 0,
      detail: samePerson
        ? a.offenderConfirmed
          ? `Same suspect on both records (${displayName(a.offender as string)})`
          : `Same demo suspect profile (${displayName(a.offender as string)}) - unconfirmed`
        : 'Different suspects named',
    })
  }

  if (inRecent) {
    raw.push({
      key: 'window',
      strength: crossWindow ? 1 : 0,
      detail: crossWindow
        ? 'One incident in the recent window, one in the one before'
        : 'Both sit in the same comparison window',
    })
  }

  const totalWeight = raw.reduce((sum, feature) => sum + WEIGHTS[feature.key], 0)
  const weighted = raw.reduce(
    (sum, feature) => sum + WEIGHTS[feature.key] * feature.strength,
    0,
  )
  const score = Math.round((weighted / totalWeight) * 100)
  // A confirmed shared suspect always links the pair; otherwise the score must
  // clear the reporting threshold.
  if (!confirmedSamePerson && score < LINK_MIN_SCORE) return null

  const features: LinkFeature[] = raw
    .map((feature) => ({
      key: feature.key,
      label: FEATURE_LABEL[feature.key],
      strength: round1(feature.strength * 100) / 100,
      weight: WEIGHTS[feature.key],
      points: round1((WEIGHTS[feature.key] * feature.strength * 100) / totalWeight),
      detail: feature.detail,
    }))
    .sort((x, y) => y.points - x.points)

  const rationale = [
    `${score}/100 association - ${strengthLabel(score)} link`,
    ...features.filter((feature) => feature.points > 0).map(
      (feature) => `${feature.label}: ${feature.points} pts (${feature.detail})`,
    ),
  ]

  return {
    id: pairKey(a.incident.id, b.incident.id),
    a: a.incident.id,
    b: b.incident.id,
    score,
    strength: strengthLabel(score),
    distanceMeters: Math.round(distance),
    hoursApart: Math.round(hours * 10) / 10,
    sameCategory,
    sameArea,
    sharedOffender,
    crossWindow,
    features,
    rationale,
  }
}

/** Title-cases a lower-cased offender name for display. */
function displayName(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Union-find over incident ids to turn pairwise links into networks. */
class DisjointSet {
  private parent = new Map<string, string>()

  find(id: string): string {
    const parent = this.parent.get(id)
    if (parent === undefined || parent === id) {
      this.parent.set(id, id)
      return id
    }
    const root = this.find(parent)
    this.parent.set(id, root)
    return root
  }

  union(a: string, b: string): void {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA !== rootB) this.parent.set(rootB, rootA)
  }
}

function dominantOf(values: CrimeCategory[], fallback: CrimeCategory): CrimeCategory {
  const counts = new Map<CrimeCategory, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let best = fallback
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

function buildClusters(links: IncidentLink[], byId: Map<string, CrimeIncident>): LinkCluster[] {
  // Only strong links are allowed to merge incidents into a network. Using every
  // reported pair would transitively collapse the whole dataset into one blob.
  const strong = links.filter((link) => link.score >= LINK_STRONG_SCORE)
  const ds = new DisjointSet()
  for (const link of strong) ds.union(link.a, link.b)

  const groups = new Map<string, IncidentLink[]>()
  for (const link of strong) {
    const root = ds.find(link.a)
    const bucket = groups.get(root)
    if (bucket) bucket.push(link)
    else groups.set(root, [link])
  }

  const clusters: LinkCluster[] = []
  for (const [root, groupLinks] of groups) {
    const ids = new Set<string>()
    for (const link of groupLinks) {
      ids.add(link.a)
      ids.add(link.b)
    }
    // A network only becomes interesting at three or more incidents.
    if (ids.size < 3) continue

    const members = [...ids]
      .map((id) => byId.get(id))
      .filter((incident): incident is CrimeIncident => incident !== undefined)
    const times = members.map((incident) => new Date(incident.occurredAt).getTime())
    const areas = [...new Set(members.map((incident) => incident.area))].sort()
    const categories = [...new Set(members.map((incident) => incident.category))]
    const score = Math.round(
      groupLinks.reduce((sum, link) => sum + link.score, 0) / groupLinks.length,
    )
    const sharedOffender =
      groupLinks.map((link) => link.sharedOffender).find((name) => name !== null) ?? null

    const rationale = [
      `${members.length} incidents linked across ${areas.length} localit${areas.length === 1 ? 'y' : 'ies'}`,
      sharedOffender
        ? `Shared suspect: ${displayName(sharedOffender)}`
        : `No shared suspect on record - linked on type, place and timing`,
      `Window: ${new Date(Math.min(...times)).toISOString().slice(0, 10)} → ${new Date(Math.max(...times)).toISOString().slice(0, 10)}`,
      `Mean association ${score}/100 (${strengthLabel(score)})`,
    ]

    clusters.push({
      id: `NET-${root}`,
      incidentIds: members.map((incident) => incident.id).sort(),
      size: members.length,
      areas,
      categories,
      dominantCategory: dominantOf(categories, members[0]?.category ?? 'Other'),
      sharedOffender,
      earliest: new Date(Math.min(...times)).toISOString(),
      latest: new Date(Math.max(...times)).toISOString(),
      score,
      strength: strengthLabel(score),
      rationale,
    })
  }

  return clusters.sort((a, b) => b.size - a.size || b.score - a.score)
}

function buildRepeatSuspects(incidents: CrimeIncident[]): RepeatSuspect[] {
  const groups = new Map<string, CrimeIncident[]>()
  for (const incident of incidents) {
    const offender = offenderFor(incident)
    if (offender === null) continue
    const name = offender.name.trim().toLowerCase()
    const bucket = groups.get(name)
    if (bucket) bucket.push(incident)
    else groups.set(name, [incident])
  }

  const suspects: RepeatSuspect[] = []
  for (const [name, members] of groups) {
    if (members.length < 2) continue
    const times = members.map((incident) => new Date(incident.occurredAt).getTime())
    suspects.push({
      name: displayName(name),
      incidentIds: members.map((incident) => incident.id).sort(),
      areas: [...new Set(members.map((incident) => incident.area))].sort(),
      categories: [...new Set(members.map((incident) => incident.category))],
      count: members.length,
      earliest: new Date(Math.min(...times)).toISOString(),
      latest: new Date(Math.max(...times)).toISOString(),
    })
  }

  return suspects.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export interface LinkAnalysisOptions {
  /** Recent/previous windows used to mark past-vs-present links. */
  window?: AnalysisWindow
  /** Overridable clock for stable snapshots/tests. */
  generatedAt?: string
  /** Maximum links to retain (strongest first). Defaults to all passing pairs. */
  maxLinks?: number
}

/**
 * Runs the linkage model over a set of incidents and returns the scored links,
 * the incident networks they form and the repeat suspects behind them.
 */
export function computeLinkAnalysis(
  incidents: CrimeIncident[],
  options: LinkAnalysisOptions = {},
): LinkAnalysisResult {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const empty: LinkAnalysisResult = {
    modelVersion: LINKAGE_MODEL_VERSION,
    generatedAt,
    links: [],
    clusters: [],
    repeatSuspects: [],
    scanned: incidents.length,
    linkedPairs: 0,
    isDemo: incidents.every((incident) => incident.isDemo),
  }
  if (incidents.length < 2) return empty

  const window = options.window ?? null
  const inRecent = window
    ? (timeMs: number) => (timeMs >= window.recentFrom && timeMs <= window.recentTo ? 1 : 0)
    : null

  const prepared = incidents.map(prepare)
  const byId = new Map(incidents.map((incident) => [incident.id, incident]))
  const sorted = [...prepared].sort((a, b) => a.timeMs - b.timeMs)

  const linksById = new Map<string, IncidentLink>()

  const consider = (a: Prepared, b: Prepared) => {
    const key = pairKey(a.incident.id, b.incident.id)
    if (linksById.has(key)) return
    const link = scorePair(a, b, inRecent)
    if (link) linksById.set(key, link)
  }

  // Pass 1 - temporal sliding window: only ever compares incidents within the
  // linking horizon, so the scan stays near-linear instead of O(n^2).
  const maxDeltaMs = LINK_MAX_HOURS * MS_PER_HOUR
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (sorted[j].timeMs - sorted[i].timeMs > maxDeltaMs) break
      consider(sorted[i], sorted[j])
    }
  }

  // Pass 2 - same named suspect anywhere in the dataset: a repeat offender ties
  // incidents together even when they fall outside the temporal horizon.
  const byOffender = new Map<string, Prepared[]>()
  for (const entry of prepared) {
    if (entry.offender === null) continue
    const bucket = byOffender.get(entry.offender)
    if (bucket) bucket.push(entry)
    else byOffender.set(entry.offender, [entry])
  }
  for (const group of byOffender.values()) {
    if (group.length < 2) continue
    const capped = group.slice(0, 30)
    for (let i = 0; i < capped.length; i += 1) {
      for (let j = i + 1; j < capped.length; j += 1) {
        consider(capped[i], capped[j])
      }
    }
  }

  const allLinks = [...linksById.values()].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id),
  )
  const links = options.maxLinks ? allLinks.slice(0, options.maxLinks) : allLinks

  return {
    modelVersion: LINKAGE_MODEL_VERSION,
    generatedAt,
    links,
    clusters: buildClusters(links, byId),
    repeatSuspects: buildRepeatSuspects(incidents),
    scanned: incidents.length,
    linkedPairs: allLinks.length,
    isDemo: incidents.every((incident) => incident.isDemo),
  }
}

/** Convenience: links touching one specific incident, strongest first. */
export function linksForIncident(
  incidentId: string,
  result: LinkAnalysisResult,
): IncidentLink[] {
  return result.links.filter((link) => link.a === incidentId || link.b === incidentId)
}
