import { Check, Maximize2, Minimize2, Navigation, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { CrimeIncident } from '../../types'
import { formatDateTime } from '../../utils/format'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { StatusBadge } from '../ui/Badge'

interface IncidentSheetProps {
  incident: CrimeIncident
  onClose: () => void
  onEdit: (incident: CrimeIncident) => void
  onDelete: (incidentId: string) => void
}

/** Google-Maps-style bottom sheet shown when a crime marker is tapped. */
export function IncidentSheet({
  incident,
  onClose,
  onEdit,
  onDelete,
}: IncidentSheetProps) {
  const [confirming, setConfirming] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const accent = CRIME_CATEGORY_COLORS[incident.category]

  return (
    <section
      className={`incident-sheet-in pointer-events-auto scroll-thin absolute bottom-0 z-[1300] overflow-y-auto border-t border-navy-600 bg-navy-900/97 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-[border-radius] duration-200 ${
        expanded
          ? 'left-0 right-0 top-0 rounded-none'
          : 'left-0 right-0 max-h-[75%] rounded-t-3xl'
      }`}
      aria-label={`Incident ${incident.id} details`}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-label={expanded ? 'Collapse incident details' : 'Expand incident details'}
        className="mx-auto mt-2 flex h-6 w-12 items-center justify-center rounded-full"
      >
        <span className="h-1 w-9 rounded-full bg-navy-500 transition-colors hover:bg-navy-400" aria-hidden />
      </button>

      <header className="flex items-start justify-between gap-2 px-3.5 pb-1.5 pt-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 px-2 py-0.5 text-[10px] font-bold"
              style={{ color: accent }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              {incident.category}
            </span>
            <StatusBadge status={incident.status} />
          </div>
          <h2 className="mt-1.5 truncate text-[14px] font-semibold text-steel-100">
            {incident.id} &middot; {incident.area}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? 'Collapse incident details' : 'Expand incident details'}
            title={expanded ? 'Collapse' : 'Expand to full screen'}
            className="rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident details"
            className="shrink-0 rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div className="px-3.5 pb-3">
        <div className="rounded-xl border border-navy-600 bg-navy-800/70 px-2.5 py-1">
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-navy-600 py-1.5 text-[11px]">
            <span className="shrink-0 text-steel-500">Occurred</span>
            <span className="text-right font-medium text-steel-100">
              {formatDateTime(incident.occurredAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-dashed border-navy-600 py-1.5 text-[11px]">
            <span className="shrink-0 text-steel-500">Coordinates</span>
            <span className="text-right font-medium font-mono text-steel-100">
              {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
            </span>
          </div>
          {incident.description ? (
            <div className="flex items-start justify-between gap-3 border-b border-dashed border-navy-600 py-1.5 text-[11px]">
              <span className="shrink-0 text-steel-500">Details</span>
              <span className="text-right font-medium text-steel-100">
                {incident.description}
              </span>
            </div>
          ) : null}
          <p className="py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
            {incident.isDemo
              ? 'DEMO DATA - NOT REAL CRIME INFORMATION'
              : 'USER-REPORTED - NOT VERIFIED'}
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(incident)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500/15 px-3 py-2.5 text-[12px] font-semibold text-amber-700 transition-colors hover:bg-amber-500/25"
          >
            <Pencil className="size-4" aria-hidden /> Edit crime &amp; location
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <Navigation className="size-4" aria-hidden /> Get directions
          </a>

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDelete(incident.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-risk-critical/60 bg-risk-critical/20 px-3 py-2.5 text-[12px] font-semibold text-risk-critical transition-colors hover:bg-risk-critical/30"
              >
                <Check className="size-4" aria-hidden /> Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2.5 text-[12px] font-semibold text-steel-200 transition-colors hover:bg-navy-700 hover:text-steel-100"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-risk-critical/50 bg-transparent px-3 py-2.5 text-[12px] font-semibold text-risk-critical transition-colors hover:bg-risk-critical/15"
            >
              <Trash2 className="size-4" aria-hidden /> Delete crime
            </button>
          )}
        </div>
      </div>
    </section>
  )
}