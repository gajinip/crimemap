import { TriangleAlert } from 'lucide-react'

/** Persistent, visible disclaimer required for every screen of the app. */
export function DemoBanner() {
  return (
    <div className="safe-top flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-center">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
        <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
        Demo data - not real crime information
      </span>
      <span className="text-[10px] text-amber-200/70">
        Synthetic sample records for interface demonstration only. No real incidents, victims or
        police reports are shown.
      </span>
    </div>
  )
}
