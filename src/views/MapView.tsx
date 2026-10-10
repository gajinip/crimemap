import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { CrimeMap } from '../components/map/CrimeMap'
import { IncidentEditor } from '../components/map/IncidentEditor'
import { IncidentSheet } from '../components/map/IncidentSheet'
import { MapLegend } from '../components/map/MapLegend'
import { ZoneDetailPanel } from '../components/map/ZoneDetailPanel'
import { AreaDatePanel } from '../components/AreaDatePanel'
import { FilterPanel } from '../components/FilterPanel'
import { DEMO_AREAS, PUDUCHERRY_CENTER } from '../data/areas'
import type {
  CrimeFilterState,
  CrimeIncident,
  GeoPoint,
  PoliceStation,
  Recommendation,
  RiskZone,
} from '../types'
import { ALL_AREAS } from '../utils/filters'

interface EditorState {
  mode: 'create' | 'edit'
  incident: CrimeIncident
}

/** Allocates the next sequential CRM-YYYY-NNNN id for a new record. */
function nextIncidentId(incidents: CrimeIncident[]): string {
  let max = 0
  for (const incident of incidents) {
    const match = /^CRM-\d{4}-(\d+)$/.exec(incident.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `CRM-${new Date().getFullYear()}-${String(max + 1).padStart(4, '0')}`
}

interface MapViewProps {
  incidents: CrimeIncident[]
  zones: RiskZone[]
  stations: PoliceStation[]
  filters: CrimeFilterState
  categoryCounts: Record<string, number>
  totalIncidents: number
  selectedArea: string
  selectedZone: RiskZone | null
  selectedRecommendation: Recommendation | null
  onSelectZone: (zoneId: string) => void
  onCloseZone: () => void
  onFocusArea: (area: string) => void
  onFiltersChange: (filters: CrimeFilterState) => void
  onResetFilters: () => void
  onUpdateIncident: (incident: CrimeIncident) => void
  onCreateIncident: (incident: CrimeIncident) => void
  onDeleteIncident: (incidentId: string) => void
}

export function MapView({
  incidents,
  zones,
  stations,
  filters,
  categoryCounts,
  totalIncidents,
  selectedArea,
  selectedZone,
  selectedRecommendation,
  onSelectZone,
  onCloseZone,
  onFocusArea,
  onFiltersChange,
  onResetFilters,
  onUpdateIncident,
  onCreateIncident,
  onDeleteIncident,
}: MapViewProps) {
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [pickingLocation, setPickingLocation] = useState(false)
  const [pickedPoint, setPickedPoint] = useState<GeoPoint | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<CrimeIncident | null>(null)

  const openEditor = useCallback(
    (incident: CrimeIncident) => {
      onCloseZone()
      setSelectedIncident(null)
      setEditor({ mode: 'edit', incident })
      setPickingLocation(false)
      setPickedPoint(null)
    },
    [onCloseZone],
  )

  const openCreate = useCallback(() => {
    onCloseZone()
    setSelectedIncident(null)
    const area =
      selectedArea !== ALL_AREAS
        ? DEMO_AREAS.find((entry) => entry.name === selectedArea) ?? null
        : null
    const draft: CrimeIncident = {
      id: nextIncidentId(incidents),
      category: filters.categories[0] ?? 'Theft',
      occurredAt: new Date().toISOString(),
      area: area?.name ?? DEMO_AREAS[0].name,
      description: '',
      status: 'Reported',
      isDemo: false,
      lat: area?.lat ?? PUDUCHERRY_CENTER.lat,
      lng: area?.lng ?? PUDUCHERRY_CENTER.lng,
    }
    setEditor({ mode: 'create', incident: draft })
    setPickingLocation(false)
    setPickedPoint(null)
  }, [incidents, selectedArea, filters.categories, onCloseZone])

  const closeEditor = useCallback(() => {
    setEditor(null)
    setPickingLocation(false)
    setPickedPoint(null)
  }, [])

  const handlePickLocation = useCallback((point: GeoPoint) => {
    setPickedPoint(point)
    setPickingLocation(false)
  }, [])

  const handleSelectIncident = useCallback(
    (incident: CrimeIncident) => {
      onCloseZone()
      setSelectedIncident(incident)
    },
    [onCloseZone],
  )

  const handleDeselectIncident = useCallback(() => {
    setSelectedIncident(null)
  }, [])

  const handleSave = useCallback(
    (updated: CrimeIncident) => {
      if (editor?.mode === 'create') onCreateIncident(updated)
      else onUpdateIncident(updated)
      closeEditor()
    },
    [editor, onCreateIncident, onUpdateIncident, closeEditor],
  )

  const handleDelete = useCallback(
    (incidentId: string) => {
      onDeleteIncident(incidentId)
      if (editor?.incident.id === incidentId) closeEditor()
    },
    [onDeleteIncident, editor, closeEditor],
  )

  return (
    <div className="relative h-full w-full">
      <CrimeMap
        incidents={incidents}
        zones={zones}
        stations={stations}
        selectedArea={selectedArea}
        searchQuery={filters.searchQuery}
        selectedZoneId={selectedZone ? selectedZone.id : null}
        onSelectZone={onSelectZone}
        onSelectIncident={handleSelectIncident}
        onDeselectIncident={handleDeselectIncident}
        pickingLocation={pickingLocation}
        onPickLocation={handlePickLocation}
      />
      <FilterPanel
        filters={filters}
        categoryCounts={categoryCounts}
        visibleCount={incidents.length}
        totalCount={totalIncidents}
        onChange={onFiltersChange}
        onReset={onResetFilters}
      />
      <AreaDatePanel
        area={filters.area}
        areas={DEMO_AREAS.map((entry) => entry.name).sort((a, b) => a.localeCompare(b))}
        dateRange={filters.dateRange}
        onAreaChange={(area) => onFiltersChange({ ...filters, area })}
        onDateRangeChange={(dateRange) => onFiltersChange({ ...filters, dateRange })}
      />
      <MapLegend />
      {selectedIncident ? (
        <IncidentSheet
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onEdit={(incident) => {
            setSelectedIncident(null)
            openEditor(incident)
          }}
          onDelete={(incidentId) => {
            setSelectedIncident(null)
            onDeleteIncident(incidentId)
          }}
        />
      ) : null}
      {editor ? null : (
        <button
          type="button"
          onClick={openCreate}
          aria-label="Report a new crime incident"
          title="Report a new crime incident"
          className="pointer-events-auto absolute bottom-28 right-3 z-[1200] grid size-11 place-items-center rounded-full border border-blue-500/60 bg-blue-600 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition-colors hover:bg-blue-500"
        >
          <Plus className="size-6" aria-hidden />
        </button>
      )}
      {selectedZone ? (
        <ZoneDetailPanel
          zone={selectedZone}
          recommendation={selectedRecommendation}
          onClose={onCloseZone}
          onFocusArea={onFocusArea}
        />
      ) : null}
      {editor ? (
        <IncidentEditor
          key={editor.incident.id}
          incident={editor.incident}
          mode={editor.mode}
          picking={pickingLocation}
          picked={pickedPoint}
          onTogglePick={() => setPickingLocation((current) => !current)}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={closeEditor}
        />
      ) : null}
    </div>
  )
}
