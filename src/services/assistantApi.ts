import type { AssistantContext } from '../analytics/assistant'
import { formatNumber, formatPercent } from '../utils/format'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

const API_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() ?? ''
const MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || 'gpt-4o-mini'

export type ChatRole = 'user' | 'assistant'
export interface ChatTurn {
  role: ChatRole
  content: string
}

/** True when an LLM API key is present, so answers stream from the live model. */
export function isLiveAssistantConfigured(): boolean {
  return API_KEY.length > 0
}

export function liveModelLabel(): string {
  return MODEL
}

/** Source lines shown under a live answer, describing the data the model was given. */
export function assistantSources(ctx: AssistantContext): string[] {
  return [
    `${MODEL} · streaming`,
    `${ctx.window.recentLabel} vs ${ctx.window.previousLabel}`,
    `${formatNumber(ctx.incidents.length)} incidents · ${ctx.zones.length} zones · ${formatNumber(ctx.recommendations.length)} recommendations`,
  ]
}

function digest(ctx: AssistantContext): string {
  const lines: string[] = [
    `Analysis window: ${ctx.window.recentLabel} (recent) vs ${ctx.window.previousLabel} (previous).`,
    `Incidents analysed: ${formatNumber(ctx.incidents.length)}.`,
  ]

  const zones = [...ctx.zones].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6)
  if (zones.length > 0) {
    lines.push('Top risk zones (area, score/100, level, trend, incidents, dominant crime, peak):')
    for (const zone of zones) {
      lines.push(
        `- ${zone.area}: ${zone.riskScore}/100 ${zone.riskLevel}, trend ${formatPercent(zone.trendPercent, 1)}, ${zone.crimeCount} incidents, dominant ${zone.dominantCrime}, peak ${zone.peakWindow}.`,
      )
    }
  }

  if (ctx.recommendations.length > 0) {
    lines.push('Recommendations (priority, area, headline, units, window):')
    for (const recommendation of ctx.recommendations.slice(0, 5)) {
      lines.push(
        `- ${recommendation.priority} ${recommendation.area}: ${recommendation.headline} (${recommendation.units} unit(s), ${recommendation.window}).`,
      )
    }
  }

  if (ctx.changes.signals.length > 0) {
    lines.push('Recent change signals (kind, area, headline, detail):')
    for (const signal of ctx.changes.signals.slice(0, 6)) {
      lines.push(`- ${signal.kind} ${signal.area}: ${signal.headline} (${signal.detail}).`)
    }
  }

  if (ctx.stations.length > 0) {
    lines.push(
      `Police stations (${ctx.stations.length}): ${ctx.stations.map((station) => station.name).join(', ')}.`,
    )
  }

  return lines.join('\n')
}

function systemPrompt(ctx: AssistantContext): string {
  return [
    "You are CRIMEMAP's operational analyst assistant embedded in a police intelligence app.",
    "Answer the user's question using ONLY the data digest below. Never invent counts, zones or statistics. Cite specific numbers when relevant.",
    'Keep answers concise and operational: short paragraphs or bullet points. Be direct and helpful.',
    'If the digest lacks the requested detail, say so plainly instead of guessing.',
    '',
    'DATA DIGEST:',
    digest(ctx),
  ].join('\n')
}

/** Streams an answer from the live model, yielding text deltas as they arrive. */
export async function* streamAssistantAnswer(
  turns: ChatTurn[],
  ctx: AssistantContext,
): AsyncGenerator<string> {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.3,
      messages: [{ role: 'system', content: systemPrompt(ctx) }, ...turns],
    }),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => `HTTP ${response.status}`)
    throw new Error(detail || `HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload) continue
      if (payload === '[DONE]') return
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta.length > 0) yield delta
      } catch {
        // Ignore malformed / partial SSE frames.
      }
    }
  }
}
