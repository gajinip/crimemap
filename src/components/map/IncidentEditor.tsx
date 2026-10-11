import { Crosshair, MapPin, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { DEMO_AREAS } from '../../data/areas'
import type { CrimeCategory, CrimeIncident, GeoPoint, IncidentStatus } from '../../types'
import { CRIME_CATEGORIES, INCIDENT_STATUSES } from '../../types'

interface IncidentEditorProps {
  incident: CrimeIncident
  mode: 'create' | 'edit'
  picking: boolean
  picked: GeoPoint | null
  onTogglePick: () => void
  onSave: (incident: CrimeIncident) => void
  onDelete: (incidentId: string) => void
  onCancel: () => void
}

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-navy-600 bg-navy-800 px-3 t-base text-steel-200 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'

/** ISO timestamp -> value usable by <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

/** Bottom sheet for updating a crime incident's details and location. */
export function IncidentEditor({
  incident,
  mode,
  picking,
  picked,
  onTogglePick,
  onSave,
  onDelete,
  onCancel,
}: IncidentEditorProps) {
  const { t } = useI18n()
  const isCreate = mode === 'create'
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [category, setCategory] = useState<CrimeCategory>(incident.category)
  const [status, setStatus] = useState<IncidentStatus>(incident.status)
  const [area, setArea] = useState(incident.area)
  const [occurredAt, setOccurredAt] = useState(toLocalInput(incident.occurredAt))
  const [description, setDescription] = useState(incident.description)
  const [lat, setLat] = useState(String(incident.lat))
  const [lng, setLng] = useState(String(incident.lng))
  const [appliedPick, setAppliedPick] = useState<GeoPoint | null>(null)

  // Adjusting state while rendering when the picked point changes.
  if (picked && picked !== appliedPick) {
    setAppliedPick(picked)
    setLat(picked.lat.toFixed(6))
    setLng(picked.lng.toFixed(6))
  }

  const handleSave = () => {
    const parsedLat = Number(lat)
    const parsedLng = Number(lng)
    const parsedDate = occurredAt ? new Date(occurredAt) : new Date(incident.occurredAt)
    onSave({
      ...incident,
      category,
      status,
      area,
      description,
      occurredAt: Number.isNaN(parsedDate.getTime())
        ? incident.occurredAt
        : parsedDate.toISOString(),
      lat: Number.isFinite(parsedLat) ? parsedLat : incident.lat,
      lng: Number.isFinite(parsedLng) ? parsedLng : incident.lng,
    })
  }

  // While picking, collapse to a thin bar so the map is fully tappable.
  if (picking) {
    return (
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[1400] flex justify-center">
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-blue-400/70 bg-blue-600/95 px-3.5 py-2 text-center t-base font-semibold text-white shadow-[0_14px_40px_rgba(0,0,0,0.6)] backdrop-blur">
          <Crosshair className="size-4 shrink-0 animate-pulse" aria-hidden />
          <span>{t('Tap map to place pin')}</span>
          <button
            type="button"
            onClick={onTogglePick}
            className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 t-sm font-semibold text-white hover:bg-white/20"
          >
            {t('Cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <aside
      className="pointer-events-auto scroll-thin absolute inset-x-2 bottom-2 z-[1400] max-h-[82%] overflow-y-auto rounded-xl border border-navy-600 bg-navy-900/97 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      aria-label={t('Update incident {id}', { id: incident.id })}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-navy-700 bg-navy-900/97 px-3 py-2.5 backdrop-blur">
        <div className="min-w-0">
          <p className="editor-eyebrow font-bold uppercase tracking-[0.16em] text-steel-500">
            {isCreate ? t('Report new crime') : t('Update incident')}
          </p>
          <h2 className="truncate t-md font-semibold text-steel-100">
            {incident.id} &middot; {area || incident.area}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t('Cancel editing')}
          className="shrink-0 rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-steel-100"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex flex-col gap-3 p-3">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Category')}
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CrimeCategory)}
              className={FIELD_CLASS}
            >
              {CRIME_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {t('category.' + option)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Status')}
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as IncidentStatus)}
              className={FIELD_CLASS}
            >
              {INCIDENT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {t('status.' + option)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
              {t('Area')}
            </span>
            <select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className={FIELD_CLASS}
            >
              {DEMO_AREAS.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
            {t('Occurred')}
          </span>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-500">
            {t('Description')}
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 t-base text-steel-200 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
          />
        </label>

        <div className="rounded-lg border border-navy-600 bg-navy-800 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 t-xs font-bold uppercase tracking-[0.12em] text-steel-400">
              <MapPin className="size-3.5 text-blue-400" aria-hidden /> {t('Location')}
            </span>
            <button
              type="button"
              onClick={onTogglePick}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-700 px-2.5 py-1.5 t-sm font-semibold text-steel-200 transition-colors hover:bg-navy-600 hover:text-steel-100"
            >
              <Crosshair className="size-3.5" aria-hidden />
              {t('Pick on map')}
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Latitude')}</span>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(event) => setLat(event.target.value)}
                className={FIELD_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Longitude')}</span>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(event) => setLng(event.target.value)}
                className={FIELD_CLASS}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 t-base font-semibold text-white hover:bg-blue-500"
          >
            {isCreate ? t('Create crime') : t('Save changes')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 t-base font-semibold text-steel-200 hover:bg-navy-700 hover:text-steel-100"
          >
            {t('Cancel')}
          </button>
        </div>

        {isCreate ? null : confirmingDelete ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(incident.id)}
              className="flex-1 rounded-lg border border-risk-critical/60 bg-risk-critical/20 px-3 py-2 t-base font-semibold text-risk-critical hover:bg-risk-critical/30"
            >
              {t('Confirm delete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 t-base font-semibold text-steel-200 hover:bg-navy-700 hover:text-steel-100"
            >
              {t('Keep')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-risk-critical/50 px-3 py-2 t-base font-semibold text-risk-critical hover:bg-risk-critical/15"
          >
            <Trash2 className="size-4" aria-hidden /> {t('Delete crime')}
          </button>
        )}
      </div>
    </aside>
  )
}
