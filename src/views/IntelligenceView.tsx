import { Brain, Send, Sparkles, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { DemoChip } from '../components/ui/Badge'
import { answerQuestion, SUGGESTED_PROMPTS, type AssistantContext } from '../analytics/assistant'
import {
  assistantSources,
  isLiveAssistantConfigured,
  liveModelLabel,
  streamAssistantAnswer,
} from '../services/assistantApi'
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
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  sources: string[]
  streaming: boolean
  error?: boolean
}

/** Conversational assistant backed by a live LLM, with a deterministic fallback. */
export function IntelligenceView({
  incidents,
  zones,
  changes,
  recommendations,
  stations,
  window: analysisWindow,
}: IntelligenceViewProps) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const live = isLiveAssistantConfigured()

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const appendToLast = (chunk: string) => {
    setMessages((current) => {
      const last = current[current.length - 1]
      if (!last || last.role !== 'assistant') return current
      return [...current.slice(0, -1), { ...last, text: last.text + chunk }]
    })
  }

  const finalizeLast = (patch: Partial<ChatMessage>) => {
    setMessages((current) => {
      const last = current[current.length - 1]
      if (!last || last.role !== 'assistant') return current
      return [...current.slice(0, -1), { ...last, ...patch, streaming: false }]
    })
  }

  const handleAsk = async (text: string) => {
    const question = text.trim()
    if (!question || busy) return
    setDraft('')
    setBusy(true)

    const history = messages.map((message) => ({ role: message.role, content: message.text }))
    setMessages((current) => [
      ...current,
      { role: 'user', text: question, sources: [], streaming: false },
      { role: 'assistant', text: '', sources: [], streaming: true },
    ])

    if (!live) {
      const result = answerQuestion(question, context)
      finalizeLast({ text: result.text, sources: result.sources })
      setBusy(false)
      return
    }

    try {
      const turns = [...history, { role: 'user' as const, content: question }]
      for await (const delta of streamAssistantAnswer(turns, context)) {
        appendToLast(delta)
      }
      finalizeLast({ sources: assistantSources(context) })
    } catch {
      const fallback = answerQuestion(question, context)
      finalizeLast({
        text: `Live model unavailable - answered from the local rule engine.\n\n${fallback.text}`,
        sources: fallback.sources,
        error: true,
      })
    } finally {
      setBusy(false)
    }
  }

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleAsk(draft)
    }
  }

  return (
    <div className="flex h-full flex-col bg-navy-950">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-navy-800 px-3 pb-3 pt-3 xl:px-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[18px] font-bold leading-tight text-white xl:text-[22px]">
            <span className="grid size-6 place-items-center rounded bg-blue-600/20 text-blue-300">
              <Brain className="size-4" aria-hidden />
            </span>
            Intelligence Assistant
          </h1>
          <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-steel-400">
            {live
              ? `Answers stream live from ${liveModelLabel()}, grounded in the current risk zones, incidents and changes.`
              : 'Rule-based, explainable assistant. Answers cite concrete values from the current demo dataset.'}
          </p>
        </div>
        <DemoChip />
      </header>

      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3 xl:px-4">
        {messages.length === 0 ? (
          <div className="mt-3 rounded-2xl rounded-bl-md border border-navy-700 bg-navy-900 px-3 py-3">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
              <Sparkles className="size-4 text-blue-300" aria-hidden />
              How can I help?
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-steel-400">
              Ask about risk zones, trends, hotspots, patrol timing or recommendations.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleAsk(prompt)}
                  className="rounded-full border border-navy-600 px-2.5 py-1 text-[11px] text-steel-300 hover:border-blue-500/60 hover:text-blue-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-3">
          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div
                key={index}
                className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-blue-600 px-3 py-2 text-[13px] leading-relaxed text-white"
              >
                {message.text}
              </div>
            ) : (
              <div key={index} className="mr-auto flex max-w-[92%] flex-col gap-2">
                <div
                  className={`whitespace-pre-wrap rounded-2xl rounded-bl-md border px-3 py-2 text-[13px] leading-relaxed ${
                    message.error
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                      : 'border-navy-700 bg-navy-800 text-steel-100'
                  }`}
                >
                  {message.streaming && message.text.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-steel-400">
                      <Zap className="size-3.5 animate-pulse text-blue-400" aria-hidden />
                      Thinking...
                    </span>
                  ) : (
                    message.text
                  )}
                  {message.streaming && message.text.length > 0 ? (
                    <span className="ml-0.5 inline-block h-3.5 w-[6px] translate-y-[2px] animate-pulse bg-blue-300 align-middle" />
                  ) : null}
                </div>

                {!message.streaming && message.sources.length > 0 ? (
                  <div className="px-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
                      Sources
                    </p>
                    <ul className="mt-0.5 space-y-0.5 text-[10px] text-steel-400">
                      {message.sources.map((source) => (
                        <li key={source}>• {source}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!message.streaming && !message.error ? (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {SUGGESTED_PROMPTS.slice(0, 3).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void handleAsk(prompt)}
                        className="rounded-full border border-navy-600 px-2 py-0.5 text-[10px] text-steel-300 hover:border-blue-500/60 hover:text-blue-300"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          )}
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleAsk(draft)
        }}
        className="shrink-0 border-t border-navy-800 bg-navy-900 px-3 py-2.5 xl:px-4"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onComposerKeyDown}
            rows={1}
            placeholder="Ask about risk zones, trends, hotspots, recommendations..."
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-navy-600 bg-navy-950 px-3 py-2.5 text-[13px] text-steel-100 placeholder:text-steel-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            aria-label="Send"
            className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-steel-500">
          {live ? (
            <>
              <Sparkles className="size-3 text-blue-400" aria-hidden />
              Live model · {liveModelLabel()}
            </>
          ) : (
            <>
              <Zap className="size-3 text-blue-400" aria-hidden />
              Live model not configured - using the built-in rule engine.
            </>
          )}
        </p>
      </form>
    </div>
  )
}
