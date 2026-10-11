import { TriangleAlert } from 'lucide-react'

function TickerText() {
  return (
    <>
      <span className="inline-flex shrink-0 items-center gap-1.5 px-4 font-extrabold uppercase tracking-[0.14em] text-amber-300">
        <TriangleAlert className="size-3 shrink-0" aria-hidden />
        Demo data - not real crime information
      </span>
      <span className="demo-banner-note whitespace-nowrap text-amber-200/70">
        Synthetic sample records for interface demonstration only. No real incidents, victims or
        police reports are shown.
      </span>
    </>
  )
}

/** Persistent, single-line scrolling disclaimer required for every screen of the app. */
export function DemoBanner() {
  return (
    <div
      className="safe-top demo-banner overflow-hidden border-b border-amber-500/40 bg-amber-500/10"
      role="note"
      aria-label="Demo data disclaimer - not real crime information"
    >
      <div className="ticker-track flex w-max items-center py-1">
        <TickerText />
        <TickerText />
      </div>
    </div>
  )
}