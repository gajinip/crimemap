import { Brain, Send, Sparkles, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useI18n } from '../i18n/useI18n'
import { InfoPopover } from '../components/ui/InfoPopover'
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
  const { t } = useI18n()
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
        text: `${t('Live model unavailable - answered from the local rule engine.')}\n\n${fallback.text}`,
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
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-navy-800 px-3 pb-3 pt-3 xl:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-2 t-view-title font-bold leading-tight text-steel-100">
              <span className="grid size-6 place-items-center rounded bg-blue-600/20 text-blue-700">
                <Brain className="size-4" aria-hidden />
              </span>
              {t('Intelligence Assistant')}
            </h1>
            <InfoPopover
              label={t('About the assistant')}
              text={
                live
                  ? t('Answers stream live from {model}, grounded in the current incidents, risk zones and changes.', { model: liveModelLabel() })
                  : t('Rule-based, explainable assistant. Ask about any incident, area, crime type, status, trend, related crimes or recommendation in the dataset.')
              }
            />
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-3 xl:px-4">
        {messages.length === 0 ? (
          <div className="mt-3 rounded-2xl rounded-bl-md border border-navy-700 bg-navy-900 px-3 py-3">
            <p className="flex items-center gap-1.5 t-base font-semibold text-steel-100">
              <Sparkles className="size-4 text-blue-700" aria-hidden />
              {t('How can I help?')}
            </p>
            <p className="mt-1 t-base leading-relaxed text-steel-400">
              {t('Ask about any incident, area, crime type, status, trend, related crimes, patrol timing or recommendations.')}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleAsk(prompt)}
                  className="rounded-full border border-navy-600 px-2.5 py-1 t-sm text-steel-300 hover:border-blue-500/60 hover:text-blue-600"
                >
                  {t(prompt)}
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
                className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-blue-600 px-3 py-2 t-base leading-relaxed text-white"
              >
                {message.text}
              </div>
            ) : (
              <div key={index} className="mr-auto flex max-w-[92%] flex-col gap-2">
                <div
                  className={`whitespace-pre-wrap rounded-2xl rounded-bl-md border px-3 py-2 t-base leading-relaxed ${
                    message.error
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-800'
                      : 'border-navy-700 bg-navy-800 text-steel-100'
                  }`}
                >
                  {message.streaming && message.text.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-steel-400">
                      <Zap className="size-3.5 animate-pulse text-blue-400" aria-hidden />
                      {t('Thinking...')}
                    </span>
                  ) : (
                    message.text
                  )}
                  {message.streaming && message.text.length > 0 ? (
                    <span className="ml-0.5 inline-block h-3.5 w-[6px] translate-y-[2px] animate-pulse bg-blue-600 align-middle" />
                  ) : null}
                </div>

                {!message.streaming && message.sources.length > 0 ? (
                  <div className="px-1">
                    <p className="t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
                      {t('Sources')}
                    </p>
                    <ul className="mt-0.5 space-y-0.5 t-xs text-steel-400">
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
                        className="rounded-full border border-navy-600 px-2 py-0.5 t-xs text-steel-300 hover:border-blue-500/60 hover:text-blue-600"
                      >
                        {t(prompt)}
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
            placeholder={t('Ask anything about the data — areas, crime types, statuses, related crimes...')}
            className="scroll-thin max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-navy-600 bg-navy-950 px-3 py-2.5 t-base text-steel-100 placeholder:text-steel-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            aria-label={t('Send')}
            className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 flex items-center gap-1 t-xs text-steel-500">
          {live ? (
            <>
              <Sparkles className="size-3 text-blue-400" aria-hidden />
              {t('Live model · {model}', { model: liveModelLabel() })}
            </>
          ) : (
            <>
              <Zap className="size-3 text-blue-400" aria-hidden />
              {t('Live model not configured - using the built-in rule engine.')}
            </>
          )}
        </p>
      </form>
    </div>
  )
}
