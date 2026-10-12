import { Check, Navigation, Pencil, Trash2, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { CrimeIncident } from '../../types'
import { formatDateTime } from '../../utils/format'
import { offenderFor } from '../../utils/offender'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import { StatusBadge } from '../ui/Badge'
import { Sheet } from '../ui/Sheet'

interface IncidentSheetProps {
  incident: CrimeIncident
  onClose: () => void
  onEdit: (incident: CrimeIncident) => void
  onDelete: (incidentId: string) => void
}

/** Shared label/value row used inside the detail cards. */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-dashed border-navy-600 py-1.5 t-sm last:border-b-0">
      <span className="shrink-0 text-steel-500">{label}</span>
      <span className="text-right font-medium text-steel-100">{value}</span>
    </div>
  )
}

/** Responsive detail panel (bottom sheet on mobile, right drawer on desktop) shown when a crime marker is tapped. */
export function IncidentSheet({
  incident,
  onClose,
  onEdit,
  onDelete,
}: IncidentSheetProps) {
  const { t } = useI18n()
  const [confirming, setConfirming] = useState(false)
  const accent = CRIME_CATEGORY_COLORS[incident.category]
  // Suspect details come from the record when present, otherwise a deterministic
  // demo profile is derived — "shown when available".
  const offender = offenderFor(incident)

  return (
    <Sheet
      ariaLabel={t('Incident {id} details', { id: incident.id })}
      onClose={onClose}
      header={
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-navy-600 px-2 py-0.5 t-xs font-bold"
              style={{ color: accent }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              {t('category.' + incident.category)}
            </span>
            <StatusBadge status={incident.status} />
          </div>
          <h2 className="mt-1.5 truncate t-md font-semibold text-steel-100">
            {incident.id} &middot; {incident.area}
          </h2>
        </div>
      }
    >
        {incident.imageUrl ? (
          <img
            src={incident.imageUrl}
            alt={t('Evidence image')}
            className="mb-3 max-h-56 w-full rounded-xl border border-navy-600 object-cover"
          />
        ) : null}

        <div className="rounded-xl border border-navy-600 bg-navy-800/70 px-2.5 py-1">
          <Row label={t('Occurred')} value={formatDateTime(incident.occurredAt)} />
          <Row
            label={t('Coordinates')}
            value={
              <span className="font-mono">
                {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
              </span>
            }
          />
          {incident.description ? (
            <Row label={t('Details')} value={incident.description} />
          ) : null}
          {incident.caseNotes ? (
            <Row label={t('Additional details')} value={incident.caseNotes} />
          ) : null}
        </div>

        {offender ? (
          <div className="mt-3 rounded-xl border border-navy-600 bg-navy-800/70 p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ backgroundColor: `${accent}1f`, color: accent }}>
                <UserRound className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate t-base font-semibold text-steel-100">
                  {offender.name}
                  {offender.alias ? <span className="ml-1 text-steel-400">“{offender.alias}”</span> : null}
                </p>
                <p className="t-2xs uppercase tracking-[0.1em] text-steel-500">
                  {t('Person involved')}
                </p>
              </div>
            </div>
            <div className="mt-2">
              {offender.age !== null ? <Row label={t('Age')} value={offender.age} /> : null}
              <Row label={t('Gender')} value={t(offender.gender)} />
              <Row label={t('Suspect status')} value={t(offender.status)} />
              {offender.description ? (
                <Row label={t('Notes')} value={offender.description} />
              ) : null}
            </div>
          </div>
        ) : null}

        {incident.updates && incident.updates.length > 0 ? (
          <div className="mt-3 rounded-xl border border-navy-600 bg-navy-800/70 p-3">
            <p className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Report updates')}
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {incident.updates.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-navy-700 bg-navy-900/50 p-2">
                  <p className="t-sm text-steel-200">{entry.note}</p>
                  <p className="mt-0.5 t-2xs text-steel-500">
                    {formatDateTime(entry.at)} · {entry.by}
                    {entry.status ? ` · ${t('status.' + entry.status)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-3 py-1.5 text-center t-xs font-bold uppercase tracking-[0.08em] text-amber-700">
          {incident.isDemo
            ? t('DEMO DATA - NOT REAL CRIME INFORMATION')
            : t('USER-REPORTED - NOT VERIFIED')}
        </p>

        <div className="mt-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(incident)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500/15 px-3 py-2.5 t-base font-semibold text-amber-700 transition-colors hover:bg-amber-500/25"
          >
            <Pencil className="size-4" aria-hidden /> {t('Edit crime & location')}
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${incident.lat},${incident.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 t-base font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <Navigation className="size-4" aria-hidden /> {t('Get directions')}
          </a>

          {confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDelete(incident.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-risk-critical/60 bg-risk-critical/20 px-3 py-2.5 t-base font-semibold text-risk-critical transition-colors hover:bg-risk-critical/30"
              >
                <Check className="size-4" aria-hidden /> {t('Confirm delete')}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-navy-600 bg-navy-800 px-3 py-2.5 t-base font-semibold text-steel-200 transition-colors hover:bg-navy-700 hover:text-steel-100"
              >
                {t('Keep')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-risk-critical/50 bg-transparent px-3 py-2.5 t-base font-semibold text-risk-critical transition-colors hover:bg-risk-critical/15"
            >
              <Trash2 className="size-4" aria-hidden /> {t('Delete crime')}
            </button>
          )}
        </div>
    </Sheet>
  )
}
