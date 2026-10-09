import { CrimeMap } from '../components/map/CrimeMap'
import { MapLegend } from '../components/map/MapLegend'
import { ZoneDetailPanel } from '../components/map/ZoneDetailPanel'
import { FilterPanel } from '../components/FilterPanel'
import type {
  CrimeFilterState,
  CrimeIncident,
  PoliceStation,
  Recommendation,
  RiskZone,
} from '../types'

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
}: MapViewProps) {
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
      />
      <FilterPanel
        filters={filters}
        categoryCounts={categoryCounts}
        visibleCount={incidents.length}
        totalCount={totalIncidents}
        onChange={onFiltersChange}
        onReset={onResetFilters}
      />
      <MapLegend />
      {selectedZone ? (
        <ZoneDetailPanel
          zone={selectedZone}
          recommendation={selectedRecommendation}
          onClose={onCloseZone}
          onFocusArea={onFocusArea}
        />
      ) : null}
    </div>
  )
}
