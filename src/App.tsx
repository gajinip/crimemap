import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildAnalysisWindow, buildRiskForecast, computeRiskZones } from './analytics/risk'
import { detectChanges } from './analytics/changes'
import { computePredictedZones } from './analytics/prediction'
import {
  buildDispatchPlan,
  buildDispatchPlanFromPredicted,
  buildRecommendation,
} from './analytics/recommend'
import { buildPatrolPlan, buildPatrolPlanWeighted } from './analytics/patrol'
import { DemoBanner } from './components/DemoBanner'
import { BottomNav } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { TopNav } from './components/TopNav'
import { useI18n } from './i18n/useI18n'
import { PatrolProvider } from './patrol/PatrolContext'
import { crimeDataSource } from './services/crimeApi'
import type {
  AppView,
  CrimeFilterState,
  CrimeIncident,
  DateRange,
  PoliceStation,
  RiskZone,
} from './types'
import { CRIME_CATEGORIES, INCIDENT_STATUSES, RISK_LEVELS, SEVERITIES } from './types'
import {
  ALL_AREAS,
  applyContextFilters,
  applyCrimeFilters,
  countByCategory,
  filterRiskZones,
  withinDateRange,
} from './utils/filters'
import {
  buildAreaStats,
  buildCategoryStats,
  buildCategoryTrends,
  buildMonthlySeries,
  buildStatusStats,
  computeDashboardStats,
} from './utils/stats'
import { findRelatedIncidents } from './utils/relatedIncidents'
import { DashboardView } from './views/DashboardView'
import { HotspotsView } from './views/HotspotsView'
import { IntelligenceView } from './views/IntelligenceView'
import { MapView } from './views/MapView'
import { PatrolView } from './views/PatrolView'
import { PredictiveRiskView } from './views/PredictiveRiskView'
import { ReportsView } from './views/ReportsView'
import { StationsView } from './views/StationsView'
import { TrendsView } from './views/TrendsView'

const DEMO_DATE_RANGE: DateRange = { from: '2026-04-01', to: '2026-10-08' }

const EMPTY_INCIDENT_IDS: Set<string> = new Set()

const INITIAL_FILTERS: CrimeFilterState = {
  categories: [...CRIME_CATEGORIES],
  riskLevels: [...RISK_LEVELS],
  severities: [...SEVERITIES],
  statuses: [...INCIDENT_STATUSES],
  area: ALL_AREAS,
  dateRange: DEMO_DATE_RANGE,
  searchQuery: '',
}

interface LoadState {
  incidents: CrimeIncident[]
  stations: PoliceStation[]
}

/** Zone selection tracked by id *and* area so it survives re-indexing. */
interface ZoneSelection {
  id: string
  area: string
}

export default function App() {
  const { t } = useI18n()
  const [view, setView] = useState<AppView>('map')
  const [filters, setFilters] = useState<CrimeFilterState>(INITIAL_FILTERS)
  const [viewRange, setViewRange] = useState<DateRange | null>(null)
  const [data, setData] = useState<LoadState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selection, setSelection] = useState<ZoneSelection | null>(null)
  const [generatedAt] = useState(() => new Date().toISOString())

  useEffect(() => {
    let active = true

    Promise.all([crimeDataSource.fetchIncidents(), crimeDataSource.fetchStations()])
      .then(([incidents, stations]) => {
        if (active) setData({ incidents, stations })
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : t('Unable to load demo dataset'))
        }
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const incidents = useMemo(() => data?.incidents ?? [], [data])
  const stations = useMemo(() => data?.stations ?? [], [data])

  // ---------------------------------------------------------------------------
  // Global dataset. Every view except the map ignores the map's filter state
  // and works from the full incident set over the default date range.
  // ---------------------------------------------------------------------------
  const analysisWindow = useMemo(() => buildAnalysisWindow(DEMO_DATE_RANGE), [])

  const zones = useMemo(() => computeRiskZones(incidents, DEMO_DATE_RANGE), [incidents])
  const changes = useMemo(() => detectChanges(incidents, DEMO_DATE_RANGE), [incidents])
  const forecast = useMemo(() => buildRiskForecast(zones, generatedAt), [zones, generatedAt])
  const predictedZones = useMemo(
    () => computePredictedZones(zones, forecast),
    [zones, forecast],
  )
  const usingPredictions = predictedZones.length > 0
  const recommendations = useMemo(
    () =>
      usingPredictions
        ? buildDispatchPlanFromPredicted(predictedZones, stations)
        : buildDispatchPlan(zones, stations),
    [usingPredictions, predictedZones, zones, stations],
  )
  const patrolZones = useMemo(
    () => (usingPredictions ? predictedZones : zones),
    [usingPredictions, predictedZones, zones],
  )
  const patrolPlan = useMemo(
    () =>
      usingPredictions
        ? buildPatrolPlanWeighted(patrolZones, stations, recommendations, generatedAt)
        : buildPatrolPlan(patrolZones, stations, recommendations, generatedAt),
    [usingPredictions, patrolZones, stations, recommendations, generatedAt],
  )

  const selectedZone = useMemo<RiskZone | null>(() => {
    if (!selection) return null
    return (
      zones.find((zone) => zone.id === selection.id) ??
      zones.find((zone) => zone.area === selection.area) ??
      null
    )
  }, [zones, selection])

  const scopedIncidents = useMemo(
    () =>
      viewRange
        ? incidents.filter((incident) => withinDateRange(incident.occurredAt, viewRange))
        : incidents,
    [incidents, viewRange],
  )

  const stats = useMemo(
    () => computeDashboardStats(scopedIncidents, zones, viewRange, DEMO_DATE_RANGE, incidents),
    [scopedIncidents, zones, viewRange, incidents],
  )
  const categoryTrends = useMemo(
    () =>
      viewRange
        ? buildCategoryTrends(incidents, viewRange)
        : buildCategoryTrends(incidents, DEMO_DATE_RANGE, 30),
    [incidents, viewRange],
  )
  const categoryStats = useMemo(() => buildCategoryStats(incidents), [incidents])
  const areaStats = useMemo(() => buildAreaStats(incidents), [incidents])
  const monthly = useMemo(() => buildMonthlySeries(incidents, DEMO_DATE_RANGE), [incidents])
  const statusStats = useMemo(() => buildStatusStats(incidents), [incidents])
  const zoneRiskCounts = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 }
    for (const zone of zones) counts[zone.riskLevel] += 1
    return counts
  }, [zones])

  // ---------------------------------------------------------------------------
  // Map dataset. Derived from the map's own filter state only, so filtering the
  // map never changes any other view.
  // ---------------------------------------------------------------------------
  const mapContextIncidents = useMemo(
    () => applyContextFilters(incidents, filters),
    [incidents, filters],
  )
  const mapCategoryCounts = useMemo(() => countByCategory(incidents, filters), [incidents, filters])
  const mapZones = useMemo(
    () => computeRiskZones(mapContextIncidents, filters.dateRange),
    [mapContextIncidents, filters.dateRange],
  )
  const mapVisibleZones = useMemo(() => filterRiskZones(mapZones, filters), [mapZones, filters])
  const mapForecast = useMemo(() => buildRiskForecast(mapZones, generatedAt), [mapZones, generatedAt])
  const mapPredictedZones = useMemo(
    () => computePredictedZones(mapZones, mapForecast),
    [mapZones, mapForecast],
  )
  const mapRecommendations = useMemo(
    () =>
      mapPredictedZones.length > 0
        ? buildDispatchPlanFromPredicted(mapPredictedZones, stations)
        : buildDispatchPlan(mapZones, stations),
    [mapPredictedZones, mapZones, stations],
  )

  // When a single locality is selected, also surface crimes in other areas that
  // are linked to one there (same type, within 1.5 km and 72 h).
  const { mapIncidents, mapRelatedIds } = useMemo(() => {
    if (filters.area === ALL_AREAS) {
      return {
        mapIncidents: applyCrimeFilters(incidents, filters),
        mapRelatedIds: EMPTY_INCIDENT_IDS,
      }
    }

    const pool = applyCrimeFilters(incidents, { ...filters, area: ALL_AREAS })
    const seeds = pool.filter((incident) => incident.area === filters.area)
    const related = findRelatedIncidents(pool, seeds)
    return {
      mapIncidents: [...seeds, ...related],
      mapRelatedIds: new Set(related.map((incident) => incident.id)),
    }
  }, [incidents, filters])

  const mapSelectedZone = useMemo<RiskZone | null>(() => {
    if (!selection) return null
    return (
      mapZones.find((zone) => zone.id === selection.id) ??
      mapZones.find((zone) => zone.area === selection.area) ??
      null
    )
  }, [mapZones, selection])

  const mapSelectedRecommendation = useMemo(() => {
    if (!mapSelectedZone) return null
    return (
      mapRecommendations.find(
        (entry) => entry.zoneId === mapSelectedZone.id || entry.area === mapSelectedZone.area,
      ) ?? buildRecommendation(mapSelectedZone, stations)
    )
  }, [mapSelectedZone, mapRecommendations, stations])

  const resetAllFilters = useCallback(() => {
    setFilters((current) => ({
      ...INITIAL_FILTERS,
      dateRange: current.dateRange,
    }))
  }, [])

  const focusArea = useCallback((area: string) => {
    setFilters((current) => ({ ...current, area }))
    setView('map')
  }, [])

  const updateIncident = useCallback((updated: CrimeIncident) => {
    setData((current) =>
      current
        ? {
            ...current,
            incidents: current.incidents.map((incident) =>
              incident.id === updated.id ? updated : incident,
            ),
          }
        : current,
    )
  }, [])

  const deleteIncident = useCallback((incidentId: string) => {
    setData((current) =>
      current
        ? { ...current, incidents: current.incidents.filter((incident) => incident.id !== incidentId) }
        : current,
    )
  }, [])

  const createIncident = useCallback((created: CrimeIncident) => {
    setData((current) =>
      current ? { ...current, incidents: [created, ...current.incidents] } : current,
    )
    // Widen the date range so the freshly reported incident is actually visible.
    setFilters((current) => {
      const day = created.occurredAt.slice(0, 10)
      const from = day < current.dateRange.from ? day : current.dateRange.from
      const to = day > current.dateRange.to ? day : current.dateRange.to
      if (from === current.dateRange.from && to === current.dateRange.to) return current
      return { ...current, dateRange: { from, to } }
    })
  }, [])

  const navigate = useCallback((next: AppView) => {
    setView(next)
  }, [])

  const selectZone = useCallback(
    (zoneId: string) => {
      const zone =
        mapZones.find((entry) => entry.id === zoneId) ??
        zones.find((entry) => entry.id === zoneId)
      if (!zone) return
      setSelection({ id: zone.id, area: zone.area })
    },
    [mapZones, zones],
  )

  const selectZoneObject = useCallback((zone: RiskZone) => {
    setSelection({ id: zone.id, area: zone.area })
  }, [])

  if (error) {
    return (
      <div className="grid h-screen place-items-center bg-navy-950 px-6">
        <div className="max-w-md rounded-xl border border-risk-critical/40 bg-navy-900 p-6 text-center">
          <p className="t-base font-semibold text-risk-critical">{t('Failed to load demo dataset')}</p>
          <p className="mt-2 t-base leading-relaxed text-steel-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setReloadKey((value) => value + 1)
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 t-base font-semibold text-white hover:bg-blue-500"
          >
            <RefreshCw className="size-4" /> {t('Retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid h-screen place-items-center bg-navy-950">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-7 animate-spin text-blue-400" aria-hidden />
          <p className="mt-3 t-base uppercase tracking-[0.2em] text-steel-400">
            {t('Loading demo dataset')}
          </p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <DashboardView
            stats={stats}
            zones={zones}
            range={DEMO_DATE_RANGE}
            compareRange={viewRange}
            onCompareRangeChange={setViewRange}
            categoryTrends={categoryTrends}
            incidents={incidents}
            stations={stations}
          />
        )
      case 'hotspots':
        return (
          <HotspotsView
            zones={zones}
            recommendations={recommendations}
            selectedZone={selectedZone}
            onFocusArea={focusArea}
            onSelectZone={selectZoneObject}
            onCloseDetails={() => setSelection(null)}
          />
        )
      case 'trends':
        return (
          <TrendsView
            stats={stats}
            monthly={monthly}
            categoryStats={categoryStats}
            areaStats={areaStats}
            statusStats={statusStats}
            zoneRiskCounts={zoneRiskCounts}
            changes={changes}
            onFocusArea={focusArea}
          />
        )
      case 'intelligence':
        return (
          <IntelligenceView
            incidents={incidents}
            zones={zones}
            changes={changes}
            recommendations={recommendations}
            stations={stations}
            window={analysisWindow}
          />
        )
      case 'predictive-risk':
        return <PredictiveRiskView forecast={forecast} onFocusArea={focusArea} />
      case 'patrol':
        return (
          <PatrolView
            dispatchPlan={patrolPlan}
            stations={stations}
            zones={patrolZones}
            recommendations={recommendations}
            predictionSource={usingPredictions ? 'predicted' : 'measured'}
          />
        )
      case 'stations':
        return <StationsView stations={stations} incidents={incidents} onFocusArea={focusArea} />
      case 'reports':
        return (
          <ReportsView
            incidents={incidents}
            zones={zones}
            changes={changes}
            stations={stations}
            stats={stats}
            categoryStats={categoryStats}
            filters={INITIAL_FILTERS}
          />
        )
      case 'map':
      default:
        return (
          <MapView
            incidents={mapIncidents}
            zones={mapVisibleZones}
            stations={stations}
            filters={filters}
            categoryCounts={mapCategoryCounts}
            totalIncidents={incidents.length}
            selectedArea={filters.area}
            relatedIncidentIds={mapRelatedIds}
            selectedZone={mapSelectedZone}
            selectedRecommendation={mapSelectedRecommendation}
            onSelectZone={selectZone}
            onCloseZone={() => setSelection(null)}
            onFocusArea={focusArea}
            onFiltersChange={setFilters}
            onResetFilters={resetAllFilters}
            onUpdateIncident={updateIncident}
            onCreateIncident={createIncident}
            onDeleteIncident={deleteIncident}
          />
        )
    }
  }

  const mainClass =
    view === 'map'
      ? 'relative h-full min-h-[320px]'
      : view === 'intelligence'
        ? 'relative mx-auto flex h-full min-h-[320px] w-full max-w-[1100px] min-w-0 flex-col'
        : view === 'dashboard'
          ? 'relative w-full min-w-0 pb-10 lg:pb-6'
          : 'relative mx-auto w-full max-w-[1440px] min-w-0 pb-10 lg:pb-6'

  return (
    <PatrolProvider plan={patrolPlan}>
      <div className="flex h-screen bg-navy-900 text-steel-100 print:block print:h-auto">
        <Sidebar activeView={view} onNavigate={navigate} />
        <div className="relative flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden bg-navy-950 print:h-auto print:overflow-visible">
          <DemoBanner />
          <TopNav
            searchQuery={filters.searchQuery}
            onSearchChange={(searchQuery) =>
              setFilters((current) => ({ ...current, searchQuery }))
            }
          />

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto print:overflow-visible">
            <main className={mainClass} key={view}>
              {renderView()}
            </main>
          </div>
          <BottomNav activeView={view} onNavigate={navigate} />
        </div>
      </div>
    </PatrolProvider>
  )
}
