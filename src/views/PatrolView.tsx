import { Activity, Clock, MapPin, Navigation, ShieldCheck } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type {
  PatrolPlan,
  PredictionSource,
  Recommendation,
  RiskZone,
  PoliceStation,
} from '../types'
import { usePatrol } from '../patrol/usePatrol'
import { InfoPopover } from '../components/ui/InfoPopover'
import { Panel } from '../components/ui/Panel'
import { RecommendationCard } from '../components/RecommendationCard'
import { RiskBreakdown } from '../components/RiskBreakdown'
import { formatDateTime, formatNumber } from '../utils/format'

interface PatrolViewProps {
  dispatchPlan: PatrolPlan
  stations: PoliceStation[]
  zones: RiskZone[]
  recommendations: Recommendation[]
  /** Whether dispatch inputs came from the forward view or measured zones. */
  predictionSource?: PredictionSource
}

/** Patrol operations view: dispatch plan, simulated units, zone priorities. */
export function PatrolView({
  dispatchPlan,
  zones,
  recommendations,
  predictionSource = 'measured',
}: PatrolViewProps) {
  const { t } = useI18n()
  const { units, running, speed, changeSpeed, toggleRunning, reset } = usePatrol()
  const usingPredicted = predictionSource === 'predicted'

  return (
    <div className="scroll-thin flex flex-col gap-3 p-3 pb-8 xl:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
                <h1 className="t-view-title font-bold leading-tight text-steel-100">
              {t('Patrol Operations')}
            </h1>
            <InfoPopover
              label={t('About patrol operations')}
              text={t('Deterministic dispatch plan built from {source}. The live unit simulation is a demo and does not reflect real patrol movements.', { source: usingPredicted ? t('forward-adjusted predictions') : t('current risk zones') })}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleRunning}
            className="rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 t-sm font-semibold text-white hover:bg-blue-500"
          >
            {running ? t('Pause simulation') : t('Run simulation')}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 t-sm font-semibold text-steel-200 hover:bg-navy-700"
          >
            {t('Reset')}
          </button>
        </div>
      </header>

      <div className="grid w-full grid-cols-1 min-w-0 gap-3 lg:grid-cols-12">
        <section className="grid grid-cols-1 min-w-0 gap-3 lg:col-span-5 xl:col-span-4">
          <Panel
            title={t('Dispatch plan')}
            subtitle={
              usingPredicted
                ? t('Priority-weighted by predicted risk')
                : t('Priority order by highest risk zone')
            }
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 t-xs text-steel-500">
              <span className="inline-flex items-center gap-1">
                <Activity className="size-3" /> {t('Units: {count}', { count: dispatchPlan.units.length })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Navigation className="size-3" /> {t('Zones covered: {count}', { count: dispatchPlan.coveredZones })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {formatDateTime(dispatchPlan.generatedAt)}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-blue-600/15 px-1.5 py-px t-2xs font-bold uppercase tracking-[0.12em] text-blue-700">
                {usingPredicted ? t('Predicted view') : t('Measured view')}
              </span>
            </div>
            <p className="mt-2 t-sm leading-relaxed text-steel-400">
              {t('The unit pool is allocated priority-weighted: higher-priority zones (and, within a priority, higher predicted scores) are staffed to their recommended strength first, so units concentrate where future risk is elevated. High-confidence high-risk zones are never demoted below their measured need.')}
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
                      <span className="t-xs font-mono text-steel-500">#{index + 1}</span>
                      <p className="truncate t-base font-semibold text-steel-100">{zone.area}</p>
                      <p className="t-xs text-steel-500">
                        {t('Risk {score}/100', { score: zone.riskScore })} · {recommendation.units} {recommendation.units === 1 ? t('unit') : t('units')} · {recommendation.window}
                      </p>
                    </div>
                    <span className="shrink-0 t-xs font-semibold text-blue-700">
                      {recommendation.priority}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title={t('Simulation controls')} subtitle={t('Demo only')}>
            <div className="space-y-2.5">
              <label className="flex items-center justify-between gap-2 t-sm text-steel-300">
                <span>{t('Simulation speed (× realtime)')}</span>
                <span className="font-mono t-xs">{speed.toFixed(1)}x</span>
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
              <div className="flex flex-wrap gap-1.5 t-xs text-steel-500">
                <span>0.25x</span>
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
                <span>3.0x</span>
              </div>
            </div>
            <p className="mt-2 t-xs leading-relaxed text-steel-600">
              {t('Units update at ~4 Hz to keep the animation smooth. Routes are synthetic and fixed to each assigned risk zone and its nearest station.')}
            </p>
          </Panel>

          <Panel title={t('Live patrol units')} subtitle={t('{count} simulated units', { count: units.length })}>
            {units.length === 0 ? (
              <p className="t-sm text-steel-500">
                {t('No units active yet. Start the simulation to see animated patrols on the map.')}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {units.map((unit) => (
                  <li
                    key={unit.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="t-base font-semibold text-steel-100">{unit.callsign}</p>
                      <p className="mt-0.5 flex items-center gap-1 t-xs text-steel-400">
                        <MapPin className="size-3 shrink-0" />
                        <span className="min-w-0 truncate">
                          {t('{area} · Base {station}', { area: unit.zoneArea, station: unit.stationName })}
                        </span>
                      </p>
                      <p className="mt-0.5 t-xs text-steel-500">
                        {t('Status:')} <span className="font-semibold">{t('patrol.' + unit.displayStatus)}</span> · {t('ETA')}{' '}
                        {unit.etaMinutes > 0 ? t('{minutes} min', { minutes: unit.etaMinutes }) : t('On station')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono t-xs text-steel-400">{unit.id}</span>
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-blue-600/15 px-1.5 py-px t-2xs font-bold uppercase tracking-[0.12em] text-blue-700">
                        <ShieldCheck className="size-3" /> {t('Demo')}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        <section className="grid grid-cols-1 min-w-0 gap-3 lg:col-span-7 xl:col-span-8">
          {recommendations.length > 0 ? (
            <Panel
              title={t('Operational recommendations')}
              subtitle={t('{count} actionable items', { count: recommendations.length })}
            >
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.zoneId} recommendation={recommendation} />
                ))}
              </div>
            </Panel>
          ) : null}

          {zones.length > 0 ? (
            <Panel
              title={t('Zone risk breakdown')}
              subtitle={t('{count} active risk zones (0–100)', { count: formatNumber(zones.length) })}
            >
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {zones.slice(0, 4).map((zone) => (
                  <RiskBreakdown key={zone.id} zone={zone} compact />
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title={t('Notes')} subtitle={t('Simulation disclaimer')}>
            <p className="t-sm leading-relaxed text-steel-500">
              {t('Patrol routes, ETAs and unit behaviour are synthetic and deterministic for demo purposes only. No connection to live GPS, CAD or radio systems. Dispatch priorities derive entirely from explainable, rule-based scoring of the bundled demo incidents.')}
            </p>
          </Panel>
        </section>
      </div>
    </div>
  )
}
