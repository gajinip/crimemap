import { Link2, Network, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useI18n } from '../../i18n/useI18n'
import {
  computeLinkAnalysis,
  LINKAGE_MODEL_VERSION,
  type LinkAnalysisOptions,
} from '../../analytics/linkage'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'
import type { AnalysisWindow, CrimeIncident } from '../../types'

interface CrimeLinkPanelProps {
  incidents: CrimeIncident[]
  /** Recent/previous windows, so past-vs-present links can be flagged. */
  window?: AnalysisWindow
}

const STRENGTH_CLASS: Record<'strong' | 'moderate' | 'weak', string> = {
  strong: 'border-risk-high/40 bg-risk-high/10 text-risk-high',
  moderate: 'border-risk-medium/40 bg-risk-medium/10 text-risk-medium',
  weak: 'border-navy-600 bg-navy-800 text-steel-400',
}

/** Colour-coded score pill used across the panel. */
function ScorePill({ score, strength }: { score: number; strength: keyof typeof STRENGTH_CLASS }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono t-2xs font-bold ${STRENGTH_CLASS[strength]}`}
    >
      {score}
    </span>
  )
}

/**
 * Dashboard crime-link analysis.
 *
 * Renders the output of the explainable linkage model in
 * `src/analytics/linkage.ts`: repeat suspects (same person), linked incident
 * networks, and the strongest individual past/present associations with their
 * top reasons. Everything shown is derived from the demo dataset.
 */
export function CrimeLinkPanel({ incidents, window }: CrimeLinkPanelProps) {
  const { t } = useI18n()

  const analysis = useMemo(() => {
    const options: LinkAnalysisOptions = { window, maxLinks: 8 }
    return computeLinkAnalysis(incidents, options)
  }, [incidents, window])

  const suspects = analysis.repeatSuspects.slice(0, 3)
  const networks = analysis.clusters.slice(0, 3)
  const byId = useMemo(
    () => new Map(incidents.map((incident) => [incident.id, incident])),
    [incidents],
  )

  return (
    <section className="rounded-xl border border-navy-700 bg-navy-850 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-blue-600/15 text-blue-700">
          <Network className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="t-base font-bold text-steel-100">{t('Crime link analysis')}</h2>
          <p className="t-xs text-steel-400">
            {t('Explainable similarity model - same person, place, type and method')}
          </p>
        </div>
        <span className="rounded-full border border-navy-600 px-2 py-0.5 font-mono t-2xs text-steel-500">
          {LINKAGE_MODEL_VERSION}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-navy-700 bg-navy-800/60 px-2.5 py-2">
          <p className="t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
            {t('Scanned')}
          </p>
          <p className="mt-0.5 t-lg font-bold text-steel-100">{analysis.scanned}</p>
        </div>
        <div className="rounded-lg border border-navy-700 bg-navy-800/60 px-2.5 py-2">
          <p className="t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
            {t('Linked pairs')}
          </p>
          <p className="mt-0.5 t-lg font-bold text-steel-100">{analysis.linkedPairs}</p>
        </div>
        <div className="rounded-lg border border-navy-700 bg-navy-800/60 px-2.5 py-2">
          <p className="t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
            {t('Networks')}
          </p>
          <p className="mt-0.5 t-lg font-bold text-steel-100">{analysis.clusters.length}</p>
        </div>
      </div>

      {suspects.length > 0 ? (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
            <Users className="size-3.5" aria-hidden />
            {t('Same person - repeat suspects')}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {suspects.map((suspect) => (
              <li
                key={suspect.name}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-navy-700 bg-navy-800/60 px-3 py-2"
              >
                <span className="t-base font-semibold text-steel-100">{suspect.name}</span>
                <span className="rounded-full bg-blue-600/15 px-2 py-0.5 font-mono t-2xs font-bold text-blue-700">
                  {t('{count} incidents', { count: suspect.count })}
                </span>
                <span className="min-w-0 flex-1 truncate t-xs text-steel-400">
                  {suspect.areas.join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {networks.length > 0 ? (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
            <Network className="size-3.5" aria-hidden />
            {t('Linked networks')}
          </p>
          <ul className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {networks.map((cluster) => {
              const accent = CRIME_CATEGORY_COLORS[cluster.dominantCategory]
              return (
                <li
                  key={cluster.id}
                  className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-navy-700 bg-navy-800/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 t-2xs font-bold uppercase tracking-[0.08em]"
                      style={{ color: accent, backgroundColor: `${accent}1f` }}
                    >
                      {t('category.' + cluster.dominantCategory)}
                    </span>
                    <ScorePill score={cluster.score} strength={cluster.strength} />
                  </div>
                  <p className="t-base font-semibold text-steel-100">
                    {t('{count} incidents', { count: cluster.size })}
                  </p>
                  <p className="truncate t-xs text-steel-400">{cluster.areas.join(' · ')}</p>
                  <p className="t-xs leading-relaxed text-steel-400">
                    {cluster.sharedOffender
                      ? t('Shared suspect {name}', { name: cluster.sharedOffender })
                      : t('Linked on type, place and timing')}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {analysis.links.length > 0 ? (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 t-2xs font-bold uppercase tracking-[0.12em] text-steel-500">
            <Link2 className="size-3.5" aria-hidden />
            {t('Strongest links')}
          </p>
          <ul className="mt-2 flex flex-col divide-y divide-navy-700">
            {analysis.links.slice(0, 5).map((link) => {
              const top = link.features.find((feature) => feature.points > 0)
              const a = byId.get(link.a)
              const b = byId.get(link.b)
              return (
                <li key={link.id} className="flex min-w-0 items-start gap-3 py-2">
                  <ScorePill score={link.score} strength={link.strength} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono t-xs text-steel-100">
                      {link.a} <span className="text-steel-500">↔</span> {link.b}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 t-xs text-steel-400">
                      {a && b ? <span className="truncate">{a.area} · {b.area}</span> : null}
                      <span>{(link.distanceMeters / 1000).toFixed(1)} km</span>
                      {link.crossWindow ? (
                        <span className="rounded-full bg-blue-600/15 px-1.5 py-px t-2xs font-bold uppercase tracking-[0.06em] text-blue-700">
                          {t('Past · Present')}
                        </span>
                      ) : null}
                    </p>
                    {top ? (
                      <p className="mt-0.5 truncate t-xs text-steel-400">
                        {t(top.label)}: {top.detail}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-3 t-base text-steel-400">
          {t('No incidents clear the linking threshold in the current dataset.')}
        </p>
      )}

      <p className="mt-3 text-center t-2xs font-bold uppercase tracking-[0.08em] text-amber-700">
        {t('DEMO DATA - NOT REAL CRIME INFORMATION')}
      </p>
    </section>
  )
}
