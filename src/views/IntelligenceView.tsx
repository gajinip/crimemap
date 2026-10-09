import { Brain, Sparkles, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { WhatChangedPanel } from '../components/WhatChangedPanel'
import { DemoChip } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import { answerQuestion, SUGGESTED_PROMPTS, type AssistantContext } from '../analytics/assistant'
import type {
  AnalysisWindow,
  ChangeReport,
  CrimeIncident,
  PoliceStation,
  Recommendation,
  RiskZone,
} from '../types'

interface IntelligenceViewProps {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  changes: ChangeReport
  recommendations: Recommendation[]
  stations: PoliceStation[]
  window: AnalysisWindow
  onFocusArea: (area: string) => void
}

/** Rule-based AI assistant for quick operational questions. */
export function IntelligenceView({
  incidents,
  zones,
  changes,
  recommendations,
  stations,
  window: analysisWindow,
  onFocusArea,
}: IntelligenceViewProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string>('')
  const [sources, setSources] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const context = useMemo<AssistantContext>(
    () => ({
      incidents,
      zones,
      changes,
      recommendations,
      stations,
      window: analysisWindow,
    }),
    [incidents, zones, changes, recommendations, stations, analysisWindow],
  )

  const handleAsk = (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    setLoading(true)
    const res = answerQuestion(q, context)
    setQuestion(q)
    setAnswer(res.text)
    setSources(res.sources)
    setSuggestions(res.suggestions)
    setLoading(false)
  }

  return (
    <div className="scroll-thin flex h-full flex-col gap-3 overflow-y-auto bg-navy-950 p-3 pb-6 xl:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold leading-tight text-white xl:text-[22px]">
            Intelligence Assistant
          </h1>
          <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-steel-400">
            Rule-based, explainable assistant. Answers cite concrete values from the current demo
            dataset - never guesses beyond computed risk zones, incidents and changes.
          </p>
        </div>
        <DemoChip />
      </header>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <section className="flex flex-col rounded-xl border border-navy-700 bg-navy-900">
          <header className="flex items-center gap-2 border-b border-navy-700 px-3 py-2.5">
            <span className="grid size-6 place-items-center rounded bg-blue-600/20 text-blue-300">
              <Brain className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">Ask</p>
              <p className="text-[10px] text-steel-500">e.g. "Which area needs patrols now?"</p>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-2.5 p-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Ask about risk zones, trends, hotspots, recommendations..."
              className="w-full rounded-lg border border-navy-600 bg-navy-950 px-3 py-2 text-[12px] text-steel-100 placeholder:text-steel-600 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleAsk(prompt)}
                  className="rounded-full border border-navy-600 px-2.5 py-1 text-[10px] text-steel-300 hover:border-blue-500/60 hover:text-blue-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleAsk(question)}
              disabled={loading}
              className="mt-auto inline-flex items-center gap-2 self-start rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Thinking...' : 'Ask'}
              <Sparkles className="size-4" />
            </button>
          </div>
          {answer ? (
            <div className="border-t border-navy-700 px-3 py-3">
              <p className="text-[12px] leading-relaxed text-steel-100 whitespace-pre-wrap">
                {answer}
              </p>
              {sources.length > 0 ? (
                <div className="mt-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
                    Sources
                  </p>
                  <ul className="mt-1 space-y-0.5 text-[10px] text-steel-400">
                    {sources.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {suggestions.length > 0 ? (
                <div className="mt-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
                    Follow-ups
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAsk(s)}
                        className="rounded-full border border-navy-600 px-2 py-0.5 text-[10px] text-steel-300 hover:border-blue-500/60 hover:text-blue-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <WhatChangedPanel report={changes} onFocusArea={onFocusArea} />
      </div>

      <Panel title="Assistant guidelines" subtitle="Explainable & rule-based">
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-steel-400">
          <li className="flex items-start gap-1.5">
            <Zap className="mt-0.5 size-3.5 text-blue-400" /> Answers only from computed analytics:
            risk zones, incidents, changes, forecast summary and dispatch.
          </li>
          <li className="flex items-start gap-1.5">
            <Zap className="mt-0.5 size-3.5 text-blue-400" /> Cites numbers (counts, % change, risk
            scores) when relevant.
          </li>
          <li className="flex items-start gap-1.5">
            <Zap className="mt-0.5 size-3.5 text-blue-400" /> Never claims live feeds or exact
            prediction - uses "Risk Forecast" terminology.
          </li>
          <li className="flex items-start gap-1.5">
            <Zap className="mt-0.5 size-3.5 text-blue-400" /> Designed to be swappable for an LLM API
            later without changing UI contracts.
          </li>
        </ul>
      </Panel>
    </div>
  )
}
