import { ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import {
  CRIME_CATEGORIES,
  INCIDENT_STATUSES,
  RISK_LEVELS,
  SEVERITIES,
  type CrimeCategory,
  type CrimeFilterState,
  type IncidentStatus,
  type RiskLevel,
  type Severity,
} from '../types'
import { timePresets } from '../utils/filters'
import { CRIME_CATEGORY_COLORS, RISK_LEVEL_COLORS } from '../utils/visuals'

interface FilterPanelProps {
  filters: CrimeFilterState
  categoryCounts: Record<string, number>
  visibleCount: number
  totalCount: number
  onChange: (filters: CrimeFilterState) => void
  onReset: () => void
}

const PRESETS = timePresets()

/** Floating crime filter controls rendered on top of the map. */
export function FilterPanel({
  filters,
  categoryCounts,
  visibleCount,
  totalCount,
  onChange,
  onReset,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false)

  const toggleCategory = (category: CrimeCategory) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((entry) => entry !== category)
      : [...filters.categories, category]
    onChange({ ...filters, categories })
  }

  const toggleRisk = (level: RiskLevel) => {
    const riskLevels = filters.riskLevels.includes(level)
      ? filters.riskLevels.filter((entry) => entry !== level)
      : [...filters.riskLevels, level]
    onChange({ ...filters, riskLevels })
  }

  const toggleSeverity = (severity: Severity) => {
    const severities = filters.severities.includes(severity)
      ? filters.severities.filter((entry) => entry !== severity)
      : [...filters.severities, severity]
    onChange({ ...filters, severities })
  }

  const toggleStatus = (status: IncidentStatus) => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter((entry) => entry !== status)
      : [...filters.statuses, status]
    onChange({ ...filters, statuses })
  }

  const isDirty =
    filters.categories.length !== CRIME_CATEGORIES.length ||
    filters.riskLevels.length !== RISK_LEVELS.length ||
    filters.severities.length !== SEVERITIES.length ||
    filters.statuses.length !== INCIDENT_STATUSES.length

  const activePreset = PRESETS.find(
    (preset) => preset.range.from === filters.dateRange.from && preset.range.to === filters.dateRange.to,
  )?.label

  const chipClass = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
      active ? '' : 'border-navy-600 text-steel-500 hover:border-navy-500'
    }`

  return (
    <div className="pointer-events-auto absolute left-2 right-2 top-2 z-[1200] rounded-lg border border-navy-600 bg-navy-900/95 shadow-[0_12px_34px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:left-3 sm:right-auto sm:top-3 sm:w-60">
      <div className="flex items-center justify-between gap-2 border-b border-navy-700 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? 'Collapse filters' : 'Expand filters'}
          className="inline-flex flex-1 items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-steel-300 hover:text-white"
        >
          <SlidersHorizontal className="size-3.5 text-blue-400" aria-hidden />
          Crime filters
        </button>
        <div className="flex items-center gap-1">
          {isDirty ? (
            <button
              type="button"
              onClick={onReset}
              title="Reset filters"
              className="rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-white"
            >
              <RotateCcw className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Collapse filters' : 'Expand filters'}
            className="rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-white"
          >
            <ChevronDown
              className={`size-3.5 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
            />
          </button>
        </div>
      </div>

      {open ? (
        <div className="scroll-thin max-h-[55vh] overflow-y-auto px-3 py-3 sm:max-h-[68vh]">
          <div className="mb-1.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>Time period</span>
            <span className="normal-case tracking-normal text-steel-600">
              {filters.dateRange.from} → {filters.dateRange.to}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => {
              const active = activePreset === preset.label
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ ...filters, dateRange: preset.range })}
                  aria-pressed={active}
                  className={chipClass(active)}
                  style={
                    active
                      ? { borderColor: '#60a5fa', backgroundColor: '#60a5fa26', color: '#60a5fa' }
                      : undefined
                  }
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="mb-1 mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>Crime type</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, categories: [...CRIME_CATEGORIES] })}
              className="text-blue-400 hover:text-blue-300"
            >
              All
            </button>
          </div>
          <ul className="space-y-0.5">
            {CRIME_CATEGORIES.map((category) => {
              const active = filters.categories.includes(category)
              const color = CRIME_CATEGORY_COLORS[category]
              const count = categoryCounts[category] ?? 0
              return (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left text-[11px] transition-colors ${
                      active ? 'bg-navy-800 text-steel-100' : 'text-steel-500 hover:bg-navy-800/60'
                    }`}
                  >
                    <span
                      className={`grid size-3.5 shrink-0 place-items-center rounded border ${
                        active ? 'border-transparent' : 'border-navy-500'
                      }`}
                      style={active ? { backgroundColor: color } : undefined}
                    >
                      {active ? (
                        <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
                          <path
                            d="m2.5 6 2.4 2.4L9.5 3.8"
                            fill="none"
                            stroke="#050a14"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="flex-1 truncate">{category}</span>
                    <span className="font-mono text-[10px] text-steel-500">{count}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mb-1.5 mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>Severity</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, severities: [...SEVERITIES] })}
              className="text-blue-400 hover:text-blue-300"
            >
              All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SEVERITIES.map((severity) => {
              const active = filters.severities.includes(severity)
              const color = RISK_LEVEL_COLORS[severity]
              return (
                <button
                  key={severity}
                  type="button"
                  onClick={() => toggleSeverity(severity)}
                  aria-pressed={active}
                  className={chipClass(active)}
                  style={{
                    borderColor: active ? color : undefined,
                    backgroundColor: active ? `${color}26` : undefined,
                    color: active ? color : undefined,
                  }}
                >
                  {severity}
                </button>
              )
            })}
          </div>

          <div className="mb-1.5 mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>Risk level (zones)</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, riskLevels: [...RISK_LEVELS] })}
              className="text-blue-400 hover:text-blue-300"
            >
              All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RISK_LEVELS.map((level) => {
              const active = filters.riskLevels.includes(level)
              const color = RISK_LEVEL_COLORS[level]
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleRisk(level)}
                  aria-pressed={active}
                  className={chipClass(active)}
                  style={{
                    borderColor: active ? color : undefined,
                    backgroundColor: active ? `${color}26` : undefined,
                    color: active ? color : undefined,
                  }}
                >
                  {level}
                </button>
              )
            })}
          </div>

          <div className="mb-1.5 mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>Incident status</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, statuses: [...INCIDENT_STATUSES] })}
              className="text-blue-400 hover:text-blue-300"
            >
              All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INCIDENT_STATUSES.map((status) => {
              const active = filters.statuses.includes(status)
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                  aria-pressed={active}
                  className="rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors"
                  style={{
                    borderColor: active ? '#60a5fa' : '#24344f',
                    backgroundColor: active ? '#60a5fa26' : 'transparent',
                    color: active ? '#60a5fa' : '#64748b',
                  }}
                >
                  {status}
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded border border-navy-600 bg-navy-800 px-2.5 py-2">
            <p className="text-[10px] leading-relaxed text-steel-400">
              Showing{' '}
              <span className="font-bold text-white">
                {visibleCount} / {totalCount}
              </span>{' '}
              demo incidents matching the active filters.
            </p>
            {isDirty ? (
              <button
                type="button"
                onClick={onReset}
                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300"
              >
                <X className="size-3" /> Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
