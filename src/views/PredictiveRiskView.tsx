import { ShieldAlert, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { DemoChip, RiskBadge, TrendIndicator } from '../components/ui/Badge'
import { InfoPopover } from '../components/ui/InfoPopover'
import { Panel } from '../components/ui/Panel'
import type { RiskForecastResponse, RiskLevel } from '../types'
import { formatPercent } from '../utils/format'
import { RISK_LEVEL_COLORS } from '../utils/visuals'

interface PredictiveRiskViewProps {
  forecast: RiskForecastResponse
  onFocusArea: (area: string) => void
}

const LEVEL_ORDER: RiskLevel[] = ['Critical', 'High', 'Medium', 'Low']

/** Risk Forecast view - deterministic forward view using current zone dynamics. */
export function PredictiveRiskView({ forecast, onFocusArea }: PredictiveRiskViewProps) {
  const predictions = [...forecast.predictions].sort(
    (a, b) => b.risk_score - a.risk_score,
  )
  const topArea = predictions[0]?.area ?? null

  const counts = LEVEL_ORDER.reduce<Record<RiskLevel, number>>(
    (acc, level) => {
      acc[level] = predictions.filter((prediction) => prediction.risk_level === level).length
      return acc
    },
    { Critical: 0, High: 0, Medium: 0, Low: 0 },
  )

  const [activeLevel, setActiveLevel] = useState<RiskLevel>(
    () => LEVEL_ORDER.find((level) => counts[level] > 0) ?? 'Critical',
  )

  const visible = predictions.filter((prediction) => prediction.risk_level === activeLevel)

  return (
    <div className="scroll-thin flex flex-col gap-3 p-3 pb-8 xl:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-bold leading-tight text-steel-100 xl:text-[22px]">
              Risk Forecast
            </h1>
            <InfoPopover
              label="About risk forecast"
              text="Deterministic, explainable outlook derived from current risk zones (trend, emerging status, peak activity). This is a situational forecast - not a probabilistic crime prediction model."
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DemoChip />
          {topArea ? (
            <button
              type="button"
              onClick={() => onFocusArea(topArea)}
              className="rounded-lg border border-blue-500/60 bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-blue-500"
            >
              View top zone on map
            </button>
          ) : null}
        </div>
      </header>

      <Panel title="Forecast summary" subtitle="Select a risk level to inspect">
        {predictions.length === 0 ? (
          <p className="text-[11px] text-steel-500">No forecastable zones for current filters.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {LEVEL_ORDER.map((level) => {
                const active = level === activeLevel
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActiveLevel(level)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? 'text-steel-100'
                        : 'border-navy-600 text-steel-300 hover:border-navy-500 hover:text-steel-100'
                    }`}
                    style={active ? { borderColor: RISK_LEVEL_COLORS[level] } : undefined}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: RISK_LEVEL_COLORS[level] }}
                      aria-hidden
                    />
                    {level}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        active ? 'bg-navy-700 text-steel-100' : 'bg-navy-800 text-steel-400'
                      }`}
                    >
                      {counts[level]}
                    </span>
                  </button>
                )
              })}
            </div>

            {visible.length === 0 ? (
              <p className="text-[11px] text-steel-500">
                No zones at {activeLevel} level for the current filters.
              </p>
            ) : (
              <div className="scroll-thin max-h-[52vh] divide-y divide-navy-700 overflow-y-auto pr-1">
                {visible.map((prediction) => (
                  <div key={prediction.zoneId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: RISK_LEVEL_COLORS[prediction.risk_level] }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-steel-100">
                          {prediction.area}
                        </span>
                        <RiskBadge level={prediction.risk_level} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-steel-500">
                        <span>{prediction.zoneId}</span>
                        <span>Confidence {formatPercent(prediction.confidence)}</span>
                        <span>Model {prediction.modelVersion}</span>
                      </div>
                      {prediction.contributing_factors.length > 0 ? (
                        <ul className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-steel-400">
                          {prediction.contributing_factors.map((factor) => (
                            <li key={factor} className="rounded bg-navy-800 px-1.5 py-px">
                              {factor}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className="text-[18px] font-bold"
                        style={{ color: RISK_LEVEL_COLORS[prediction.risk_level] }}
                      >
                        {prediction.risk_score}/100
                      </span>
                      <div className="mt-0.5 flex justify-end">
                        <TrendIndicator trend="Stable" showGlyph={false} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Panel>

      <Panel title="Methodology" subtitle="Deterministic & explainable">
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-steel-400">
          <li className="flex items-start gap-1.5">
            <ShieldAlert className="mt-0.5 size-3.5 text-blue-400" />
            No external ML model called. Forecast values are computed from each zone's score, trend
            direction and emerging status.
          </li>
          <li className="flex items-start gap-1.5">
            <TrendingUp className="mt-0.5 size-3.5 text-blue-400" />
            Trend persistence applied conservatively; zones marked emerging receive a small upward
            bias to reflect watch status.
          </li>
          <li className="flex items-start gap-1.5">
            <ShieldAlert className="mt-0.5 size-3.5 text-blue-400" />
            Confidence is a heuristic (data coverage) not a statistical probability.
          </li>
        </ul>
      </Panel>
    </div>
  )
}
