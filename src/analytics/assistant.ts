import type {
  AnalysisWindow,
  AssistantAnswer,
  ChangeReport,
  CrimeCategory,
  CrimeIncident,
  IncidentStatus,
  PoliceStation,
  Recommendation,
  RiskZone,
} from '../types'
import { CRIME_CATEGORIES, INCIDENT_STATUSES } from '../types'
import { formatNumber, formatPercent } from '../utils/format'
import { findRelatedIncidents, RELATED_MAX_DISTANCE_M, RELATED_MAX_HOURS } from '../utils/relatedIncidents'
import { hourOf } from './risk'

/**
 * Focused intelligence assistant.
 *
 * Rule-based question answering over the deterministic analytics output. Every
 * answer is generated from the current data set, so the assistant never makes
 * up numbers, never claims to predict exact events and always cites the window
 * it used.
 */

export interface AssistantContext {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  changes: ChangeReport
  recommendations: Recommendation[]
  stations: PoliceStation[]
  window: AnalysisWindow
}

export const SUGGESTED_PROMPTS: string[] = [
  'What changed recently?',
  'Which area is highest risk?',
  'Show crimes related to Mission Street',
  'How many incidents in each area?',
  'What is the most common crime type?',
  'When should we patrol?',
  'What action do you recommend?',
  'Which areas are low risk?',
]

function sourcesFor(ctx: AssistantContext): string[] {
  return [
    `Risk engine v1 - ${ctx.window.recentLabel} vs ${ctx.window.previousLabel}`,
    `${formatNumber(ctx.incidents.length)} demo incidents analysed`,
  ]
}

function zoneByName(ctx: AssistantContext, query: string): RiskZone | undefined {
  const needle = query.toLowerCase()
  return (
    ctx.zones.find((zone) => needle.includes(zone.area.toLowerCase())) ??
    [...ctx.zones].sort((a, b) => b.riskScore - a.riskScore)[0]
  )
}

function topZone(ctx: AssistantContext): RiskZone | undefined {
  return [...ctx.zones].sort((a, b) => b.riskScore - a.riskScore)[0]
}

function lowZones(ctx: AssistantContext): RiskZone[] {
  return [...ctx.zones].sort((a, b) => a.riskScore - b.riskScore).slice(0, 3)
}

function emojiFor(kind: 'rising' | 'emerging' | 'declining'): string {
  if (kind === 'rising') return '\u{1F534}'
  if (kind === 'emerging') return '\u{1F7E0}'
  return '\u{1F7E1}'
}

function answerChanges(ctx: AssistantContext): string {
  const { changes } = ctx
  if (changes.signals.length === 0) {
    return `No significant changes detected between ${changes.window.previousLabel} and ${changes.window.recentLabel}. Volume is holding steady across all localities.`
  }

  const lines = changes.signals
    .slice(0, 6)
    .map((signal) => `${emojiFor(signal.kind)} ${signal.area} - ${signal.headline} (${signal.detail})`)

  return [
    `Significant changes, ${changes.window.recentLabel} vs ${changes.window.previousLabel}:`,
    '',
    ...lines,
    '',
    `City-wide: ${formatNumber(changes.previousTotal)} → ${formatNumber(changes.recentTotal)} incidents (${formatPercent(changes.overallDeltaPercent)}).`,
  ].join('\n')
}

function answerTopRisk(ctx: AssistantContext): string {
  const zone = topZone(ctx)
  if (!zone) return 'No risk zones can be scored for the selected filters yet.'

  const drivers = zone.components
    .filter((component) => component.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((component) => `• ${component.label} +${component.points} - ${component.detail}`)

  return [
    `${zone.area} (${zone.id}) is the highest-risk locality at ${zone.riskScore}/100 - ${zone.riskLevel.toUpperCase()}.`,
    '',
    ...drivers,
    '',
    `${zone.crimeCount} incidents in the last ${ctx.window.days} days (${formatPercent(zone.trendPercent)} vs previous), dominant type: ${zone.dominantCrime}, peak ${zone.peakWindow}.`,
  ].join('\n')
}

function answerRecommendation(ctx: AssistantContext): string {
  if (ctx.recommendations.length === 0) {
    return 'No locality currently crosses the staffing threshold under the active filters.'
  }

  const lines = ctx.recommendations.slice(0, 3).flatMap((recommendation) => [
    `${recommendation.priority} · ${recommendation.area} - ${recommendation.headline}`,
    `   ${recommendation.steps[0]}`,
    `   ${recommendation.steps[1]}`,
  ])

  return ['Recommended actions (rule-based, from the current risk scores):', '', ...lines].join('\n')
}

function answerWhen(ctx: AssistantContext, query: string): string {
  const zone = zoneByName(ctx, query)
  if (!zone) return 'No zone is available for the selected filters.'
  const recommendation = ctx.recommendations.find((entry) => entry.zoneId === zone.id)

  return [
    `Patrol timing for ${zone.area}:`,
    '',
    `• Peak window ${zone.peakWindow} - ${zone.peakShare}% of the last ${ctx.window.days} days' incidents fall in that 3-hour block.`,
    `• ${recommendation ? `Suggested window: ${recommendation.window} (${recommendation.units} unit${recommendation.units === 1 ? '' : 's'}).` : 'No extra staffing suggested for this zone.'}`,
    `• Station cover: ${recommendation?.nearestStation.name ?? 'nearest station'} at ${(((recommendation?.nearestStation.distanceMeters ?? 0) / 1000)).toFixed(1)} km.`,
  ].join('\n')
}

function answerWhy(ctx: AssistantContext, query: string): string {
  const zone = zoneByName(ctx, query)
  if (!zone) return 'No zone is available for the selected filters.'

  const rows = zone.components.map(
    (component) =>
      `${component.label.padEnd(26, ' ')} +${String(component.points).padStart(4, ' ')} / ${component.max}  ${component.detail}`,
  )

  return [
    `WHY IS ${zone.area.toUpperCase()} AT RISK SCORE ${zone.riskScore}?`,
    '',
    ...rows,
    '',
    `Overall: ${zone.riskScore} / 100 - ${zone.riskLevel.toUpperCase()} (${zone.status})`,
    '',
    'Each factor is measured from the incident records; the score is their weighted sum.',
  ].join('\n')
}

function answerTrend(ctx: AssistantContext): string {
  const { changes } = ctx
  const rising = changes.signals.filter((signal) => signal.kind === 'rising')
  const declining = changes.signals.filter((signal) => signal.kind === 'declining')

  const parts = [
    `Volume ${formatPercent(changes.overallDeltaPercent)} (${formatNumber(changes.previousTotal)} → ${formatNumber(changes.recentTotal)} incidents) between ${changes.window.previousLabel} and ${changes.window.recentLabel}.`,
  ]
  if (rising.length > 0) {
    parts.push(`Rising: ${rising.map((signal) => `${signal.area} ${formatPercent(signal.deltaPercent)}`).join(', ')}`)
  }
  if (declining.length > 0) {
    parts.push(`Declining: ${declining.map((signal) => `${signal.area} ${formatPercent(signal.deltaPercent)}`).join(', ')}`)
  }
  return parts.join('\n\n')
}

function answerCategory(ctx: AssistantContext, category: CrimeCategory): string {
  const inWindow = ctx.incidents.filter(
    (incident) =>
      incident.category === category &&
      new Date(incident.occurredAt).getTime() >= ctx.window.recentFrom &&
      new Date(incident.occurredAt).getTime() <= ctx.window.recentTo,
  )
  if (inWindow.length === 0) {
    return `No ${category} incidents recorded in ${ctx.window.recentLabel} for the active filters.`
  }

  const byArea = new Map<string, number>()
  const byHour = new Array<number>(24).fill(0)
  for (const incident of inWindow) {
    byArea.set(incident.area, (byArea.get(incident.area) ?? 0) + 1)
    byHour[hourOf(incident)] += 1
  }
  const top = [...byArea.entries()].sort((a, b) => b[1] - a[1])[0]
  const peakHour = byHour.indexOf(Math.max(...byHour))

  return [
    `${category}: ${formatNumber(inWindow.length)} incidents in ${ctx.window.recentLabel}.`,
    `• Concentrated in ${top[0]} (${top[1]} reports).`,
    `• Busiest single hour: ${String(peakHour).padStart(2, '0')}:00-${String((peakHour + 1) % 24).padStart(2, '0')}:00.`,
    `• ${ctx.zones.filter((zone) => zone.dominantCrime === category && zone.riskScore >= 55).length} zone(s) score High or above with ${category} as the dominant type.`,
  ].join('\n')
}

function answerStations(ctx: AssistantContext): string {
  const zone = topZone(ctx)
  const nearest = ctx.recommendations.find((entry) => entry.zoneId === zone?.id)?.nearestStation
  return [
    `${ctx.stations.length} demo stations are mapped.`,
    nearest && zone
      ? `Nearest to the top zone (${zone.area}): ${nearest.name} - ${(nearest.distanceMeters / 1000).toFixed(1)} km.`
      : '',
    ctx.stations.length > 0
      ? `Jurisdictions cover: ${ctx.stations.slice(0, 4).map((station) => station.area).join(', ')}…`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function answerLowRisk(ctx: AssistantContext): string {
  const zones = lowZones(ctx)
  if (zones.length === 0) return 'No zones available for the current filters.'
  return [
    'Lowest-risk localities right now:',
    '',
    ...zones.map(
      (zone) =>
        `• ${zone.area} - ${zone.riskScore}/100 (${zone.riskLevel}), ${zone.crimeCount} incidents, ${zone.trend.toLowerCase()} ${formatPercent(zone.trendPercent)}`,
    ),
    '',
    'Lower score means fewer, less severe and less concentrated recent incidents - not a guarantee of safety.',
  ].join('\n')
}

function answerMethod(ctx: AssistantContext): string {
  return [
    'Every risk score is a transparent weighted sum (0-100):',
    '',
    '• Recent incident volume vs the busiest locality - up to 30 pts',
    '• Change vs the previous equal-length window - up to 20 pts',
    '• Offence severity mix - up to 15 pts',
    '• Repeat incidents within 250 m - up to 15 pts',
    '• Time-of-day concentration - up to 10 pts',
    '• Activity in adjoining localities - up to 10 pts',
    '',
    `Levels: Critical ≥ 75, High ≥ 55, Medium ≥ 35, Low < 35. Current window: ${ctx.window.recentLabel}.`,
    'No probabilistic model is executed - the same data always produces the same score.',
  ].join('\n')
}

function answerPatrol(ctx: AssistantContext): string {
  const staffed = ctx.recommendations.filter((recommendation) => recommendation.units > 0)
  const totalUnits = staffed.reduce((sum, recommendation) => sum + recommendation.units, 0)
  if (staffed.length === 0) return 'No zone currently requires additional patrol strength.'

  return [
    `${totalUnits} patrol unit${totalUnits === 1 ? '' : 's'} suggested across ${staffed.length} zone(s):`,
    '',
    ...staffed.map(
      (recommendation) =>
        `• ${recommendation.area} (${recommendation.priority}) - ${recommendation.units} unit${recommendation.units === 1 ? '' : 's'}, ${recommendation.window}, ${recommendation.focus}`,
    ),
    '',
    'Open the Patrol view to run the dispatch simulation on the map.',
  ].join('\n')
}

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

const DAY_MS = 24 * 60 * 60 * 1000

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Tally items by a string key, most frequent first. */
function tally<T>(items: T[], key: (item: T) => string): [string, number][] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const bucket = key(item)
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function incidentsInArea(ctx: AssistantContext, area: string): CrimeIncident[] {
  return ctx.incidents.filter((incident) => incident.area === area)
}

/** Earliest and latest incident timestamps in the dataset. */
function datasetSpan(ctx: AssistantContext): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const incident of ctx.incidents) {
    const time = new Date(incident.occurredAt).getTime()
    if (time < min) min = time
    if (time > max) max = time
  }
  return { min, max }
}

function allAreas(ctx: AssistantContext): string[] {
  return [...new Set(ctx.zones.map((zone) => zone.area))]
}

/** Longest-first so "Vehicle Theft" wins over "Theft". */
function matchArea(ctx: AssistantContext, query: string): string | null {
  const needle = query.toLowerCase()
  const areas = allAreas(ctx).sort((a, b) => b.length - a.length)
  return areas.find((area) => needle.includes(area.toLowerCase())) ?? null
}

function matchCategory(query: string): CrimeCategory | null {
  const needle = query.toLowerCase()
  const categories = [...CRIME_CATEGORIES].sort((a, b) => b.length - a.length)
  return categories.find((category) => needle.includes(category.toLowerCase())) ?? null
}

function matchStatus(query: string): IncidentStatus | null {
  const needle = query.toLowerCase()
  return INCIDENT_STATUSES.find((status) => needle.includes(status.toLowerCase())) ?? null
}

function matchMonth(query: string): number | null {
  const needle = query.toLowerCase()
  const index = MONTH_NAMES.findIndex((month) => needle.includes(month))
  return index === -1 ? null : index
}

interface RelativePeriod {
  from: number
  to: number
  label: string
}

function matchRelativePeriod(ctx: AssistantContext, query: string): RelativePeriod | null {
  const needle = query.toLowerCase()
  const { max } = datasetSpan(ctx)
  const endOfDay = max + DAY_MS
  const make = (days: number, label: string): RelativePeriod => ({
    from: endOfDay - days * DAY_MS,
    to: endOfDay,
    label,
  })

  if (needle.includes('today')) return make(1, 'today')
  if (needle.includes('yesterday')) return make(2, 'the last 2 days')
  if (/(last|past)\s+(7|seven)\s*days/.test(needle) || needle.includes('last week') || needle.includes('past week')) {
    return make(7, 'the last 7 days')
  }
  if (/(last|past)\s+(30|thirty)\s*days/.test(needle) || needle.includes('last month') || needle.includes('past month')) {
    return make(30, 'the last 30 days')
  }
  return null
}

/** One-line incident fingerprint used in lists. */
function incidentLine(incident: CrimeIncident): string {
  return `${incident.id} · ${incident.area} · ${capitalize(incident.category)} · ${incident.occurredAt.slice(0, 10)} · ${incident.status}`
}

function answerCounts(ctx: AssistantContext, query: string): string {
  const area = matchArea(ctx, query)
  const category = matchCategory(query)
  const status = matchStatus(query)
  const monthIndex = matchMonth(query)
  const relative = matchRelativePeriod(ctx, query)

  let pool = ctx.incidents
  const scope: string[] = []
  if (area) {
    pool = pool.filter((incident) => incident.area === area)
    scope.push(area)
  }
  if (category) {
    pool = pool.filter((incident) => incident.category === category)
    scope.push(category)
  }
  if (status) {
    pool = pool.filter((incident) => incident.status === status)
    scope.push(status)
  }

  let periodLabel = ''
  if (monthIndex !== null) {
    pool = pool.filter((incident) => new Date(incident.occurredAt).getMonth() === monthIndex)
    periodLabel = ` in ${capitalize(MONTH_NAMES[monthIndex])}`
  } else if (relative) {
    pool = pool.filter((incident) => {
      const time = new Date(incident.occurredAt).getTime()
      return time >= relative.from && time < relative.to
    })
    periodLabel = ` in ${relative.label}`
  }

  const total = ctx.incidents.length
  const scopeText = scope.length > 0 ? ` for ${scope.join(' · ')}` : ''
  const noun = category ? `${category} incidents` : 'incidents'
  const share = total > 0 ? Math.round((pool.length / total) * 1000) / 10 : 0

  const head = `${formatNumber(pool.length)} ${noun}${scopeText}${periodLabel} — ${share}% of the ${formatNumber(total)} recorded demo incidents.`
  if (pool.length === 0) {
    return `${head}\n\nNo matching records were found for that combination.`
  }

  const byCategory = tally(pool, (incident) => incident.category).slice(0, 5)
  const byStatus = tally(pool, (incident) => incident.status)
  const byArea = tally(pool, (incident) => incident.area).slice(0, 5)

  return [
    head,
    '',
    `By crime type: ${byCategory.map(([name, count]) => `${name} ${count}`).join(', ')}.`,
    `By status: ${byStatus.map(([name, count]) => `${name} ${count}`).join(', ')}.`,
    !area ? `Top areas: ${byArea.map(([name, count]) => `${name} ${count}`).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function answerMostCommon(ctx: AssistantContext): string {
  const byCategory = tally(ctx.incidents, (incident) => incident.category)
  if (byCategory.length === 0) return 'No incidents are available for the current filters.'

  const [topCategory, topCount] = byCategory[0]
  const byArea = tally(
    ctx.incidents.filter((incident) => incident.category === topCategory),
    (incident) => incident.area,
  )
  const share = Math.round((topCount / ctx.incidents.length) * 1000) / 10

  return [
    `${topCategory} is the most common crime type: ${formatNumber(topCount)} incidents (${share}% of the ${formatNumber(ctx.incidents.length)} recorded).`,
    '',
    `• Full ranking: ${byCategory.map(([name, count]) => `${name} ${count}`).join(', ')}.`,
    `• Where it concentrates: ${byArea.slice(0, 5).map(([name, count]) => `${name} ${count}`).join(', ')}.`,
  ].join('\n')
}

function answerBusiest(ctx: AssistantContext): string {
  const recent = ctx.incidents.filter(
    (incident) =>
      new Date(incident.occurredAt).getTime() >= ctx.window.recentFrom &&
      new Date(incident.occurredAt).getTime() <= ctx.window.recentTo,
  )
  if (recent.length === 0) {
    return `No incidents fall inside ${ctx.window.recentLabel}.`
  }

  const byArea = tally(recent, (incident) => incident.area).slice(0, 5)
  const byCategory = tally(recent, (incident) => incident.category)
  const hours = new Array<number>(24).fill(0)
  for (const incident of recent) hours[hourOf(incident)] += 1
  const peakHour = hours.indexOf(Math.max(...hours))
  const [topArea, topCount] = byArea[0]

  return [
    `${topArea} has the most recorded incidents in ${ctx.window.recentLabel}: ${formatNumber(topCount)} (${Math.round((topCount / recent.length) * 1000) / 10}% of the window).`,
    '',
    `Busiest areas: ${byArea.map(([area, count]) => `${area} ${count}`).join(', ')}.`,
    `Most common type: ${byCategory[0][0]} (${byCategory[0][1]} incidents).`,
    `Busiest single hour: ${String(peakHour).padStart(2, '0')}:00-${String((peakHour + 1) % 24).padStart(2, '0')}:00.`,
  ].join('\n')
}

function answerAreaProfile(ctx: AssistantContext, area: string): string {
  const zone = ctx.zones.find((entry) => entry.area === area)
  const pool = incidentsInArea(ctx, area)
  if (pool.length === 0 && !zone) {
    return `No incident records were found for ${area}.`
  }

  const byCategory = tally(pool, (incident) => incident.category).slice(0, 5)
  const byStatus = tally(pool, (incident) => incident.status)
  const hours = new Array<number>(24).fill(0)
  for (const incident of pool) hours[hourOf(incident)] += 1
  const peakHour = hours.indexOf(Math.max(...hours))

  const related = findRelatedIncidents(ctx.incidents, pool)
  const relatedByArea = tally(related, (incident) => incident.area).filter(([name]) => name !== area)

  const lines = [
    `${area.toUpperCase()} — AREA PROFILE`,
    '',
    `• Recorded incidents: ${formatNumber(pool.length)} total${zone ? `, ${zone.crimeCount} in ${ctx.window.recentLabel}` : ''}.`,
  ]
  if (zone) {
    lines.push(
      `• Risk: ${zone.riskScore}/100 ${zone.riskLevel} (${zone.status}), trend ${zone.trend} ${formatPercent(zone.trendPercent)} vs previous window.`,
      `• Dominant type: ${zone.dominantCrime} (${Math.round(zone.dominantShare * 1000) / 10}% of the window); peak ${zone.peakWindow} carrying ${zone.peakShare}% of incidents.`,
    )
  }
  if (byCategory.length > 0) {
    lines.push(`• By type: ${byCategory.map(([name, count]) => `${name} ${count}`).join(', ')}.`)
  }
  if (byStatus.length > 0) {
    lines.push(`• By status: ${byStatus.map(([name, count]) => `${name} ${count}`).join(', ')}.`)
  }
  if (pool.length > 0) {
    lines.push(
      `• Busiest hour: ${String(peakHour).padStart(2, '0')}:00-${String((peakHour + 1) % 24).padStart(2, '0')}:00.`,
    )
  }
  if (relatedByArea.length > 0) {
    lines.push(
      `• Linked incidents in other areas: ${formatNumber(related.length)} (${relatedByArea
        .slice(0, 4)
        .map(([name, count]) => `${name} ${count}`)
        .join(', ')}).`,
    )
  }

  return lines.join('\n')
}

function answerIncident(ctx: AssistantContext, id: string): string {
  const incident = ctx.incidents.find((entry) => entry.id.toLowerCase() === id.toLowerCase())
  if (!incident) {
    return `No incident with id ${id.toUpperCase()} exists in the current dataset.`
  }

  const related = findRelatedIncidents(ctx.incidents, [incident])
  const when = new Date(incident.occurredAt)

  return [
    `${incident.id} — ${capitalize(incident.category)} (${incident.status})`,
    '',
    `• Locality: ${incident.area}`,
    `• Reported: ${when.toISOString().replace('T', ' ').slice(0, 16)}`,
    `• Description: ${incident.description || 'No description recorded.'}`,
    `• Coordinates: ${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}`,
    related.length > 0
      ? `• Linked incidents: ${related.length} — ${related.slice(0, 4).map(incidentLine).join(' | ')}`
      : `• Linked incidents: none within ${RELATED_MAX_DISTANCE_M / 1000} km and ${RELATED_MAX_HOURS} h.`,
  ].join('\n')
}

function answerRelated(ctx: AssistantContext, query: string): string {
  const area = matchArea(ctx, query) ?? topZone(ctx)?.area ?? null
  const category = matchCategory(query)
  if (!area) return 'No localities are available for the current filters.'

  let seeds = incidentsInArea(ctx, area)
  if (category) seeds = seeds.filter((incident) => incident.category === category)
  if (seeds.length === 0) {
    return `No ${category ? `${category} ` : ''}incidents were recorded in ${area}, so there is nothing to link from.`
  }

  const related = findRelatedIncidents(ctx.incidents, seeds)
  const ruleLabel = `same crime type, within ${RELATED_MAX_DISTANCE_M / 1000} km and ${RELATED_MAX_HOURS} h`

  if (related.length === 0) {
    return [
      `No linked incidents found for ${area}${category ? ` (${category})` : ''} under the current dataset.`,
      '',
      `The link engine looks for a ${ruleLabel} of an incident recorded in ${area}.`,
    ].join('\n')
  }

  const byArea = tally(related, (incident) => incident.area).filter(([name]) => name !== area)
  const byCategory = tally(related, (incident) => incident.category)

  const lines = [
    `${formatNumber(related.length)} linked incident${related.length === 1 ? '' : 's'} related to ${area}${category ? ` (${category})` : ''}.`,
    '',
    `• Other areas: ${byArea.map(([name, count]) => `${name} ${count}`).join(', ')}.`,
    `• Types involved: ${byCategory.map(([name, count]) => `${name} ${count}`).join(', ')}.`,
    '',
    'Closest matches:',
    ...related.slice(0, 5).map((incident) => `• ${incidentLine(incident)}`),
    '',
    `A link means a ${ruleLabel} of an incident in ${area}. It is a pattern signal, not proof of a shared offender.`,
  ]

  return lines.join('\n')
}

function answerFallback(ctx: AssistantContext): string {
  return [
    'I answer questions from the current CRIMEMAP data. Try:',
    '',
    '• "What changed recently?"',
    '• "Which area is highest risk?"',
    '• "Why is Mission Street high risk?"',
    '• "Show crimes related to Mission Street"',
    '• "How many burglaries in September?"',
    '• "How many incidents are under investigation?"',
    '• "What is the most common crime type?"',
    '• "Which area has the most incidents?"',
    '• "Tell me about CRM-2026-0012"',
    '• "When should we patrol?"',
    '• "What action do you recommend?"',
    '',
    `Currently analysing ${formatNumber(ctx.incidents.length)} demo incidents over ${ctx.window.recentLabel}.`,
  ].join('\n')
}

/** Answers a question using only the deterministic analytics output. */
export function answerQuestion(query: string, ctx: AssistantContext): AssistantAnswer {
  const text = query.trim().toLowerCase()
  const suggestions = SUGGESTED_PROMPTS
  const has = (...needles: string[]) => needles.some((needle) => text.includes(needle))

  const idMatch = /crm-\d{4}-\d{3,}/i.exec(query)
  const category = matchCategory(query)
  const area = matchArea(ctx, query)

  let body: string

  if (!text) {
    body = answerFallback(ctx)
  } else if (idMatch) {
    body = answerIncident(ctx, idMatch[0])
  } else if (
    has(
      'related',
      'linked',
      'connected',
      'associat',
      'same mo',
      'serial',
      'spree',
      'similar crime',
      'similar incident',
      'pattern',
    )
  ) {
    body = answerRelated(ctx, query)
  } else if (has('what changed', 'changed', 'difference', 'since last', 'recent change')) {
    body = answerChanges(ctx)
  } else if (has('recommend', 'action', 'should we', 'suggest', 'next step')) {
    body = answerRecommendation(ctx)
  } else if (has('most common', 'most frequent', 'top crime', 'common crime type', 'popular crime')) {
    body = answerMostCommon(ctx)
  } else if (has('most incidents', 'most crimes', 'most reports', 'busiest', 'highest number', 'which area has the most')) {
    body = answerBusiest(ctx)
  } else if (has('when', 'peak', 'best time', 'time of day', 'hour', 'night', 'evening')) {
    body = answerWhen(ctx, query)
  } else if (has('patrol', 'dispatch', 'unit', 'deploy', 'force')) {
    body = answerPatrol(ctx)
  } else if (has('why', 'explain', 'breakdown', 'reason', 'contributing')) {
    body = answerWhy(ctx, query)
  } else if (has('how many', 'how much', 'count', 'number of', 'total incidents', 'percentage', 'share of')) {
    body = answerCounts(ctx, query)
  } else if (has('highest', 'riskiest', 'top risk', 'worst', 'most dangerous', 'highest risk')) {
    body = answerTopRisk(ctx)
  } else if (has('low risk', 'safest', 'calm', 'lowest')) {
    body = answerLowRisk(ctx)
  } else if (has('trend', 'increasing', 'decreasing', 'rising', 'falling', 'overall')) {
    body = answerTrend(ctx)
  } else if (has('station', 'nearest base', 'jurisdiction')) {
    body = answerStations(ctx)
  } else if (has('score', 'how do you', 'method', 'algorithm', 'forecast', 'confidence')) {
    body = answerMethod(ctx)
  } else if (area) {
    body = answerAreaProfile(ctx, area)
  } else if (category) {
    body = answerCategory(ctx, category)
  } else if (has('hello', 'hi ', 'hey') || text === 'hi') {
    body = `Hello. I am the CRIMEMAP analysis assistant.\n\n${answerFallback(ctx)}`
  } else {
    body = answerFallback(ctx)
  }

  return { text: body, sources: sourcesFor(ctx), suggestions }
}
