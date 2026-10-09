import { Activity, Clock, MapPin, Navigation, ShieldCheck } from 'lucide-react'
import type { PatrolPlan, Recommendation, RiskZone, PoliceStation } from '../types'
import { usePatrol } from '../patrol/usePatrol'
import { DemoChip } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import { RecommendationCard } from '../components/RecommendationCard'
import { RiskBreakdown } from '../components/RiskBreakdown'
import { formatDateTime, formatNumber } from '../utils/format'

interface PatrolViewProps {
  dispatchPlan: PatrolPlan
  stations: PoliceStation[]
  zones: RiskZone[]
  recommendations: Recommendation[]
}

/** Patrol operations view: dispatch plan, simulated units, zone priorities. */
export function PatrolView({ dispatchPlan, zones, recommendations }: PatrolViewProps) {
  const { units, running, speed, changeSpeed, toggleRunning, reset } = usePatrol()

  return (
    <div className="scroll-thin flex h-full flex-col gap-3 overflow-y-auto bg-navy-950 p-3 pb-6 xl:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold leading-tight text-white xl:text-[22px]">
            Patrol Operations
          </h1>
          <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-steel-400">
            Deterministic dispatch plan built from current risk zones. The live unit simulation is a
            demo and does not reflect real patrol movements.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DemoChip />
          <button
            type="button"
            onClick={toggleRunning}
            className="rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-500"
          >
            {running ? 'Pause simulation' : 'Run simulation'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-[11px] font-semibold text-steel-200 hover:bg-navy-700"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-12">
        <section className="grid gap-3 lg:col-span-5 xl:col-span-4">
          <Panel title="Dispatch plan" subtitle="Priority order by highest risk zone">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-steel-500">
              <span className="inline-flex items-center gap-1">
                <Activity className="size-3" /> Units: {dispatchPlan.units.length}
              </span>
              <span className="inline-flex items-center gap-1">
                <Navigation className="size-3" /> Zones covered: {dispatchPlan.coveredZones}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {formatDateTime(dispatchPlan.generatedAt)}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-steel-400">
              The unit pool is dealt round-robin across staffed recommendations, so every top-priority
              zone gets coverage before any zone gets a second unit.
            </p>
            <ul className="mt-2 space-y-1.5">
              {recommendations.map((recommendation, index) => {
                const zone = zones.find((entry) => entry.id === recommendation.zoneId)
                if (!zone) return null
                return (
                  <li
                    key={recommendation.zoneId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-steel-500">#{index + 1}</span>
                      <p className="truncate text-[12px] font-semibold text-white">{zone.area}</p>
                      <p className="text-[10px] text-steel-500">
                        Risk {zone.riskScore}/100 · {recommendation.units} unit
                        {recommendation.units === 1 ? '' : 's'} · {recommendation.window}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-300">
                      {recommendation.priority}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Simulation controls" subtitle="Demo only">
            <div className="space-y-2.5">
              <label className="flex items-center justify-between gap-2 text-[11px] text-steel-300">
                <span>Simulation speed (× realtime)</span>
                <span className="font-mono text-[10px]">{speed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min={0.25}
                max={3}
                step={0.25}
                value={speed}
                onChange={(event) => changeSpeed(Number(event.currentTarget.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex flex-wrap gap-1.5 text-[10px] text-steel-500">
                <span>0.25x</span>
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
                <span>3.0x</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-steel-600">
              Units update at ~4 Hz to keep the animation smooth. Routes are synthetic and fixed to
              each assigned risk zone and its nearest station.
            </p>
          </Panel>

          <Panel title="Live patrol units" subtitle={`${units.length} simulated units`}>
            {units.length === 0 ? (
              <p className="text-[11px] text-steel-500">
                No units active yet. Start the simulation to see animated patrols on the map.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {units.map((unit) => (
                  <li
                    key={unit.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-white">{unit.callsign}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-steel-400">
                        <MapPin className="size-3" />
                        <span className="truncate">
                          {unit.zoneArea} · Base {unit.stationName}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-steel-500">
                        Status: <span className="font-semibold">{unit.displayStatus}</span> · ETA{' '}
                        {unit.etaMinutes > 0 ? `${unit.etaMinutes} min` : 'On station'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-[10px] text-steel-400">{unit.id}</span>
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-blue-600/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] text-blue-300">
                        <ShieldCheck className="size-3" /> Demo
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        <section className="grid gap-3 lg:col-span-7 xl:col-span-8">
          {recommendations.length > 0 ? (
            <Panel
              title="Operational recommendations"
              subtitle={`${recommendations.length} actionable items`}
            >
              <div className="grid gap-2.5 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.zoneId} recommendation={recommendation} />
                ))}
              </div>
            </Panel>
          ) : null}

          {zones.length > 0 ? (
            <Panel
              title="Zone risk breakdown"
              subtitle={`${formatNumber(zones.length)} active risk zones (0–100)`}
            >
              <div className="grid gap-2.5 md:grid-cols-2">
                {zones.slice(0, 4).map((zone) => (
                  <RiskBreakdown key={zone.id} zone={zone} compact />
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title="Notes" subtitle="Simulation disclaimer">
            <p className="text-[11px] leading-relaxed text-steel-500">
              Patrol routes, ETAs and unit behaviour are synthetic and deterministic for demo
              purposes only. No connection to live GPS, CAD or radio systems. Dispatch priorities
              derive entirely from explainable, rule-based scoring of the bundled demo incidents.
            </p>
          </Panel>
        </section>
      </div>
    </div>
  )
}
