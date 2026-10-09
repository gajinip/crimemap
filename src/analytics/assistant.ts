import type {
  AnalysisWindow,
  AssistantAnswer,
  ChangeReport,
  CrimeCategory,
  CrimeIncident,
  PoliceStation,
  Recommendation,
  RiskZone,
} from '../types'
import { CRIME_CATEGORIES } from '../types'
import { formatNumber, formatPercent } from '../utils/format'
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
  'What action do you recommend?',
  'When should we patrol?',
  'Why is the top zone high risk?',
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

function answerFallback(ctx: AssistantContext): string {
  return [
    'I answer questions from the current CRIMEMAP analysis only. Try:',
    '',
    '• "What changed recently?"',
    '• "Which area is highest risk?"',
    '• "Why is Mission Street high risk?"',
    '• "When should we patrol?"',
    '• "What action do you recommend?"',
    '• "Which areas are low risk?"',
    '• a crime type, e.g. "Tell me about vehicle theft"',
    '',
    `Currently analysing ${formatNumber(ctx.incidents.length)} demo incidents over ${ctx.window.recentLabel}.`,
  ].join('\n')
}

/** Answers a question using only the deterministic analytics output. */
export function answerQuestion(query: string, ctx: AssistantContext): AssistantAnswer {
  const text = query.trim().toLowerCase()
  const suggestions = SUGGESTED_PROMPTS

  const category = CRIME_CATEGORIES.find((entry) => text.includes(entry.toLowerCase()))
  const has = (...needles: string[]) => needles.some((needle) => text.includes(needle))

  let body: string

  if (!text) {
    body = answerFallback(ctx)
  } else if (has('what changed', 'changed', 'difference', 'since last', 'recent change')) {
    body = answerChanges(ctx)
  } else if (has('recommend', 'action', 'should we', 'suggest', 'next step')) {
    body = answerRecommendation(ctx)
  } else if (has('when', 'peak', 'best time', 'time of day', 'hour', 'night', 'evening')) {
    body = answerWhen(ctx, query)
  } else if (has('patrol', 'dispatch', 'unit', 'deploy', 'force')) {
    body = answerPatrol(ctx)
  } else if (has('why', 'explain', 'breakdown', 'reason', 'contributing')) {
    body = answerWhy(ctx, query)
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
  } else if (category) {
    body = answerCategory(ctx, category)
  } else if (has('hello', 'hi ', 'hey') || text === 'hi') {
    body = `Hello. I am the CRIMEMAP analysis assistant.\n\n${answerFallback(ctx)}`
  } else {
    body = answerFallback(ctx)
  }

  return { text: body, sources: sourcesFor(ctx), suggestions }
}
