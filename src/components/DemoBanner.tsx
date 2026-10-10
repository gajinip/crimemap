import { TriangleAlert } from 'lucide-react'

/** Persistent, visible disclaimer required for every screen of the app. */
export function DemoBanner() {
  return (
    <div className="safe-top demo-banner flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 border-b border-amber-500/40 bg-amber-500/10 px-3 py-1 text-center">
      <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-[0.14em] text-amber-300">
        <TriangleAlert className="size-3 shrink-0" aria-hidden />
        Demo data - not real crime information
      </span>
      <span className="demo-banner-note text-amber-200/70">
        Synthetic sample records for interface demonstration only. No real incidents, victims or
        police reports are shown.
      </span>
    </div>
  )
}