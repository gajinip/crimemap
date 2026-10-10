import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildAnalysisWindow, buildRiskForecast, computeRiskZones } from './analytics/risk'
import { detectChanges } from './analytics/changes'
import { buildDispatchPlan, buildRecommendation } from './analytics/recommend'
import { buildPatrolPlan } from './analytics/patrol'
import { DemoBanner } from './components/DemoBanner'
import { BottomNav } from './components/BottomNav'
import { Header } from './components/Header'
import { TopNav } from './components/TopNav'
import { PatrolProvider } from './patrol/PatrolContext'
import { crimeDataSource } from './services/crimeApi'
import type {
  AppView,
  ComparePeriod,
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
} from './utils/filters'
import {
  buildAreaStats,
  buildCategoryStats,
  buildMonthlySeries,
  buildStatusStats,
  computeDashboardStats,
} from './utils/stats'
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
  const [view, setView] = useState<AppView>('map')
  const [filters, setFilters] = useState<CrimeFilterState>(INITIAL_FILTERS)
  const [comparePeriod, setComparePeriod] = useState<ComparePeriod>('Week')
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
          setError(cause instanceof Error ? cause.message : 'Unable to load demo dataset')
        }
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const incidents = useMemo(() => data?.incidents ?? [], [data])
  const stations = useMemo(() => data?.stations ?? [], [data])

  const contextIncidents = useMemo(
    () => applyContextFilters(incidents, filters),
    [incidents, filters],
  )
  const filteredIncidents = useMemo(
    () => applyCrimeFilters(incidents, filters),
    [incidents, filters],
  )
  const categoryCounts = useMemo(() => countByCategory(incidents, filters), [incidents, filters])

  const analysisWindow = useMemo(
    () => buildAnalysisWindow(filters.dateRange),
    [filters.dateRange],
  )

  const zones = useMemo(
    () => computeRiskZones(contextIncidents, filters.dateRange),
    [contextIncidents, filters.dateRange],
  )
  const visibleZones = useMemo(() => filterRiskZones(zones, filters), [zones, filters])
  const changes = useMemo(
    () => detectChanges(contextIncidents, filters.dateRange),
    [contextIncidents, filters.dateRange],
  )
  const recommendations = useMemo(
    () => buildDispatchPlan(zones, stations),
    [zones, stations],
  )
  const forecast = useMemo(
    () => buildRiskForecast(zones, generatedAt),
    [zones, generatedAt],
  )
  const patrolPlan = useMemo(
    () => buildPatrolPlan(zones, stations, recommendations, generatedAt),
    [zones, stations, recommendations, generatedAt],
  )

  const selectedZone = useMemo<RiskZone | null>(() => {
    if (!selection) return null
    return (
      zones.find((zone) => zone.id === selection.id) ??
      zones.find((zone) => zone.area === selection.area) ??
      null
    )
  }, [zones, selection])

  const selectedRecommendation = useMemo(() => {
    if (!selectedZone) return null
    return (
      recommendations.find(
        (entry) => entry.zoneId === selectedZone.id || entry.area === selectedZone.area,
      ) ?? buildRecommendation(selectedZone, stations)
    )
  }, [selectedZone, recommendations, stations])

  const stats = useMemo(
    () => computeDashboardStats(filteredIncidents, visibleZones, filters.dateRange, comparePeriod),
    [filteredIncidents, visibleZones, filters.dateRange, comparePeriod],
  )
  const categoryStats = useMemo(() => buildCategoryStats(filteredIncidents), [filteredIncidents])
  const areaStats = useMemo(() => buildAreaStats(filteredIncidents), [filteredIncidents])
  const monthly = useMemo(
    () => buildMonthlySeries(filteredIncidents, filters.dateRange),
    [filteredIncidents, filters.dateRange],
  )
  const statusStats = useMemo(() => buildStatusStats(filteredIncidents), [filteredIncidents])
  const zoneRiskCounts = useMemo(() => {
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 }
    for (const zone of visibleZones) counts[zone.riskLevel] += 1
    return counts
  }, [visibleZones])

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
      const zone = zones.find((entry) => entry.id === zoneId)
      if (!zone) return
      setSelection({ id: zone.id, area: zone.area })
    },
    [zones],
  )

  const selectZoneObject = useCallback((zone: RiskZone) => {
    setSelection({ id: zone.id, area: zone.area })
  }, [])

  if (error) {
    return (
      <div className="grid h-screen place-items-center bg-navy-950 px-6">
        <div className="max-w-md rounded-xl border border-risk-critical/40 bg-navy-900 p-6 text-center">
          <p className="text-[13px] font-semibold text-risk-critical">Failed to load demo dataset</p>
          <p className="mt-2 text-[12px] leading-relaxed text-steel-400">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setReloadKey((value) => value + 1)
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-500"
          >
            <RefreshCw className="size-4" /> Retry
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
          <p className="mt-3 text-[12px] uppercase tracking-[0.2em] text-steel-400">
            Loading demo dataset
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
            zones={visibleZones}
            comparePeriod={comparePeriod}
            onComparePeriodChange={setComparePeriod}
          />
        )
      case 'hotspots':
        return (
          <HotspotsView
            zones={visibleZones}
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
            incidents={filteredIncidents}
            zones={visibleZones}
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
            zones={visibleZones}
            recommendations={recommendations}
          />
        )
      case 'stations':
        return <StationsView stations={stations} incidents={incidents} onFocusArea={focusArea} />
      case 'reports':
        return (
          <ReportsView
            incidents={filteredIncidents}
            zones={visibleZones}
            changes={changes}
            stations={stations}
            stats={stats}
            categoryStats={categoryStats}
            filters={filters}
          />
        )
      case 'map':
      default:
        return (
          <MapView
            incidents={filteredIncidents}
            zones={visibleZones}
            stations={stations}
            filters={filters}
            categoryCounts={categoryCounts}
            totalIncidents={incidents.length}
            selectedArea={filters.area}
            selectedZone={selectedZone}
            selectedRecommendation={selectedRecommendation}
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
      : 'relative min-w-0 pb-14 xl:min-h-0 xl:flex-1'

  return (
    <PatrolProvider plan={patrolPlan}>
      <div className="flex h-screen justify-center bg-black text-steel-100">
        <div
          style={{ height: '100dvh' }}
          className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-navy-950 shadow-[0_0_60px_rgba(0,0,0,0.8)] ring-1 ring-navy-800"
        >
          <DemoBanner />
          <Header />
          <TopNav
            searchQuery={filters.searchQuery}
            onSearchChange={(searchQuery) =>
              setFilters((current) => ({ ...current, searchQuery }))
            }
          />

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
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
