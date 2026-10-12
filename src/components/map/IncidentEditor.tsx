import { Crosshair, ImagePlus, LocateFixed, MapPin, Plus, Trash2, X } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { DEMO_AREAS } from '../../data/areas'
import type {
  CrimeCategory,
  CrimeIncident,
  GeoPoint,
  IncidentStatus,
  IncidentUpdate,
  OffenderGender,
  OffenderStatus,
} from '../../types'
import { CRIME_CATEGORIES, INCIDENT_STATUSES } from '../../types'
import { formatDateTime } from '../../utils/format'
import { useGeolocation } from '../../hooks/useGeolocation'

interface IncidentEditorProps {
  incident: CrimeIncident
  mode: 'create' | 'edit'
  picking: boolean
  picked: GeoPoint | null
  /** Name recorded as the author of any report updates posted here. */
  analystName: string
  onTogglePick: () => void
  onSave: (incident: CrimeIncident) => void
  onDelete: (incidentId: string) => void
  onCancel: () => void
}

const FIELD_CLASS =
  'h-10 w-full rounded-lg border border-navy-600 bg-navy-800 px-3 t-base text-steel-200 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
const AREA_CLASS =
  'w-full resize-none rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 t-base text-steel-200 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'
const LABEL_CLASS = 't-xs font-bold uppercase tracking-[0.12em] text-steel-500'

const OFFENDER_GENDERS: OffenderGender[] = ['Male', 'Female', 'Other', 'Unknown']
const OFFENDER_STATUSES: OffenderStatus[] = ['Wanted', 'Arrested', 'Under Investigation', 'Unknown']

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
  analystName,
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

  // Suspect / person details (optional).
  const [offenderName, setOffenderName] = useState(incident.offender?.name ?? '')
  const [offenderAlias, setOffenderAlias] = useState(incident.offender?.alias ?? '')
  const [offenderAge, setOffenderAge] = useState(
    incident.offender?.age != null ? String(incident.offender.age) : '',
  )
  const [offenderGender, setOffenderGender] = useState<OffenderGender>(
    incident.offender?.gender ?? 'Unknown',
  )
  const [offenderStatus, setOffenderStatus] = useState<OffenderStatus>(
    incident.offender?.status ?? 'Unknown',
  )
  const [offenderDescription, setOffenderDescription] = useState(
    incident.offender?.description ?? '',
  )

  // Evidence photo + extra case detail + report updates.
  const [imageUrl, setImageUrl] = useState<string | undefined>(incident.imageUrl)
  const [caseNotes, setCaseNotes] = useState(incident.caseNotes ?? '')
  const [updates, setUpdates] = useState<IncidentUpdate[]>(incident.updates ?? [])
  const [updateNote, setUpdateNote] = useState('')
  const [updateStatus, setUpdateStatus] = useState<IncidentStatus | ''>('')

  // Browser location: drives the "use my current location" shortcut so an
  // operator updating a report can pin it to where they actually are. Applied
  // during render (mirroring the picked-point patch below) to avoid an extra pass.
  const geo = useGeolocation()
  const [appliedGeo, setAppliedGeo] = useState<string | null>(null)

  if (geo.status === 'success' && geo.position) {
    const key = `${geo.position.lat.toFixed(6)},${geo.position.lng.toFixed(6)}`
    if (key !== appliedGeo) {
      setAppliedGeo(key)
      setLat(geo.position.lat.toFixed(6))
      setLng(geo.position.lng.toFixed(6))
    }
  }

  // Adjusting state while rendering when the picked point changes.
  if (picked && picked !== appliedPick) {
    setAppliedPick(picked)
    setLat(picked.lat.toFixed(6))
    setLng(picked.lng.toFixed(6))
  }

  /** Read a chosen image file as a data URL so it can live on the incident. */
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setImageUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  /** Append a timestamped report update, optionally moving the case status. */
  const addUpdate = () => {
    const note = updateNote.trim()
    if (!note) return
    const entry: IncidentUpdate = {
      id: `${incident.id}-U${updates.length + 1}-${Date.now()}`,
      at: new Date().toISOString(),
      note,
      status: updateStatus || null,
      by: analystName,
    }
    setUpdates((current) => [entry, ...current])
    if (updateStatus) setStatus(updateStatus)
    setUpdateNote('')
    setUpdateStatus('')
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
      // Persist suspect details only when a name was entered.
      offender: offenderName.trim()
        ? {
            name: offenderName.trim(),
            alias: offenderAlias.trim() || null,
            age: offenderAge ? Number(offenderAge) : null,
            gender: offenderGender,
            status: offenderStatus,
            description: offenderDescription.trim(),
            isDemo: false,
          }
        : undefined,
      imageUrl,
      caseNotes: caseNotes.trim() || undefined,
      updates: updates.length > 0 ? updates : undefined,
    })
  }

  // While picking, collapse to a thin bar so the map is fully tappable.
  if (picking) {
    return (
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[1400] flex justify-center">
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-blue-400/70 bg-blue-600/95 px-3.5 py-2 text-center t-base font-semibold text-white shadow-[0_14px_40px_rgba(23,43,77,0.2)] backdrop-blur">
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
      className="pointer-events-auto scroll-thin absolute inset-x-2 bottom-2 z-[1400] max-h-[82%] overflow-y-auto rounded-xl border border-navy-600 bg-navy-900/97 shadow-[0_18px_50px_rgba(23,43,77,0.2)] backdrop-blur-sm"
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
            <span className={LABEL_CLASS}>{t('Category')}</span>
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
            <span className={LABEL_CLASS}>{t('Status')}</span>
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
            <span className={LABEL_CLASS}>{t('Area')}</span>
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
          <span className={LABEL_CLASS}>{t('Occurred')}</span>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>{t('Description')}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={AREA_CLASS + ' resize-none'}
          />
        </label>

        {/* Suspect / person details — optional, "when available". */}
        <fieldset className="rounded-lg border border-navy-600 bg-navy-800 p-2.5">
          <legend className={LABEL_CLASS}>{t('Person involved')}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Full name')}</span>
              <input
                value={offenderName}
                onChange={(event) => setOffenderName(event.target.value)}
                placeholder={t('Unknown')}
                className={FIELD_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Alias')}</span>
              <input
                value={offenderAlias}
                onChange={(event) => setOffenderAlias(event.target.value)}
                placeholder="—"
                className={FIELD_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Age')}</span>
              <input
                type="number"
                min="0"
                max="120"
                value={offenderAge}
                onChange={(event) => setOffenderAge(event.target.value)}
                placeholder="—"
                className={FIELD_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Gender')}</span>
              <select
                value={offenderGender}
                onChange={(event) => setOffenderGender(event.target.value as OffenderGender)}
                className={FIELD_CLASS}
              >
                {OFFENDER_GENDERS.map((option) => (
                  <option key={option} value={option}>
                    {t(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="t-xs font-semibold text-steel-500">{t('Suspect status')}</span>
              <select
                value={offenderStatus}
                onChange={(event) => setOffenderStatus(event.target.value as OffenderStatus)}
                className={FIELD_CLASS}
              >
                {OFFENDER_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {t(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-2.5 flex flex-col gap-1">
            <span className="t-xs font-semibold text-steel-500">{t('Suspect description')}</span>
            <textarea
              value={offenderDescription}
              onChange={(event) => setOffenderDescription(event.target.value)}
              rows={2}
              className={AREA_CLASS + ' resize-none'}
            />
          </label>
        </fieldset>

        {/* Evidence photo — stored inline as a data URL for the demo. */}
        <div className="rounded-lg border border-navy-600 bg-navy-800 p-2.5">
          <span className={LABEL_CLASS}>{t('Evidence image')}</span>
          {imageUrl ? (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt={t('Evidence image')}
                className="max-h-40 w-full rounded-lg border border-navy-600 object-cover"
              />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-risk-critical/50 px-2.5 py-1.5 t-sm font-semibold text-risk-critical hover:bg-risk-critical/15"
              >
                <Trash2 className="size-3.5" aria-hidden /> {t('Remove image')}
              </button>
            </div>
          ) : (
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy-500 bg-navy-700/40 px-3 py-3 t-sm font-semibold text-steel-300 hover:bg-navy-700/70">
              <ImagePlus className="size-4" aria-hidden /> {t('Add image')}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className={LABEL_CLASS}>{t('Additional details')}</span>
          <textarea
            value={caseNotes}
            onChange={(event) => setCaseNotes(event.target.value)}
            rows={2}
            placeholder={t('Witnesses, modus operandi, property involved…')}
            className={AREA_CLASS + ' resize-none'}
          />
        </label>

        <div className="rounded-lg border border-navy-600 bg-navy-800 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={LABEL_CLASS}>{t('Report updates')}</span>
            <span className="t-2xs text-steel-500">{updates.length}</span>
          </div>

          {updates.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {updates.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-navy-700 bg-navy-900/50 p-2">
                  <p className="t-sm text-steel-200">{entry.note}</p>
                  <p className="mt-0.5 t-2xs text-steel-500">
                    {formatDateTime(entry.at)} · {entry.by}
                    {entry.status ? ` · ${t('status.' + entry.status)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 t-sm text-steel-500">{t('No updates recorded yet.')}</p>
          )}

          <div className="mt-2 flex flex-col gap-2">
            <textarea
              value={updateNote}
              onChange={(event) => setUpdateNote(event.target.value)}
              rows={2}
              placeholder={t('Add a new report update…')}
              className={AREA_CLASS + ' resize-none'}
            />
            <div className="flex items-center gap-2">
              <select
                value={updateStatus}
                onChange={(event) => setUpdateStatus(event.target.value as IncidentStatus | '')}
                className={FIELD_CLASS}
              >
                <option value="">{t('Keep status')}</option>
                {INCIDENT_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {t('Set status: ' + option)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addUpdate}
                disabled={!updateNote.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 t-base font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" aria-hidden /> {t('Post')}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-navy-600 bg-navy-800 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 t-xs font-bold uppercase tracking-[0.12em] text-steel-400">
              <MapPin className="size-3.5 text-blue-400" aria-hidden /> {t('Location')}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={geo.locate}
                disabled={!geo.supported || geo.status === 'locating'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/50 bg-blue-600/10 px-2.5 py-1.5 t-sm font-semibold text-blue-700 transition-colors hover:bg-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LocateFixed
                  className={`size-3.5${geo.status === 'locating' ? ' animate-spin' : ''}`}
                  aria-hidden
                />
                {geo.status === 'locating' ? t('Locating…') : t('Use my location')}
              </button>
              <button
                type="button"
                onClick={onTogglePick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-700 px-2.5 py-1.5 t-sm font-semibold text-steel-200 transition-colors hover:bg-navy-600 hover:text-steel-100"
              >
                <Crosshair className="size-3.5" aria-hidden />
                {t('Pick on map')}
              </button>
            </div>
          </div>

          {geo.status === 'error' ? (
            <p className="mt-2 t-sm text-risk-critical">{geo.error}</p>
          ) : null}

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
