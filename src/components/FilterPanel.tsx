import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
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
  relatedCount?: number
  onChange: (filters: CrimeFilterState) => void
  onReset: () => void
  placement?: 'top-left' | 'bottom-right'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PRESETS = timePresets()

/** Floating crime filter controls rendered on top of the map. */
export function FilterPanel({
  filters,
  categoryCounts,
  visibleCount,
  totalCount,
  relatedCount = 0,
  onChange,
  onReset,
  placement = 'top-left',
  open: openProp,
  onOpenChange,
}: FilterPanelProps) {
  const { t } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const rootClass =
    placement === 'top-left'
      ? 'pointer-events-auto absolute left-2 top-2 z-[1200] sm:left-3 sm:top-3'
      : 'pointer-events-auto absolute bottom-3 right-3 z-[1200]'

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
    `rounded-full border px-2.5 py-1 t-xs font-semibold transition-colors ${
      active ? '' : 'border-navy-600 text-steel-500 hover:border-navy-500'
    }`

  return (
    <div className={rootClass}>
      {open ? (
        <div className="w-[calc(100vw-16px)] max-w-[290px] rounded-lg border border-navy-600 bg-navy-900/95 shadow-[0_12px_34px_rgba(23,43,77,0.18)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-navy-700 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 t-xs font-bold uppercase tracking-[0.16em] text-steel-300">
              <SlidersHorizontal className="size-3.5 text-blue-400" aria-hidden />
              {t('Crime filters')}
            </span>
            <div className="flex items-center gap-1">
              {isDirty ? (
                <button
                  type="button"
                  onClick={onReset}
                  title={t('Reset filters')}
                  className="rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-steel-100"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('Close filters')}
                className="rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-steel-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="scroll-thin max-h-[55vh] overflow-y-auto px-3 py-3 sm:max-h-[68vh]">
          <div className="mb-1.5 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>{t('Time period')}</span>
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
                      ? { borderColor: '#2676D2', backgroundColor: '#2676D226', color: '#2676D2' }
                      : undefined
                  }
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <div className="mb-1 mt-4 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>{t('Crime type')}</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, categories: [...CRIME_CATEGORIES] })}
              className="text-blue-600 hover:text-blue-500"
            >
              {t('All')}
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
                    className={`flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left t-sm transition-colors ${
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
                    <span className="flex-1 truncate">{t('category.' + category)}</span>
                    <span className="font-mono t-xs text-steel-500">{count}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mb-1.5 mt-4 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>{t('Severity')}</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, severities: [...SEVERITIES] })}
              className="text-blue-600 hover:text-blue-500"
            >
              {t('All')}
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
                  {t('severity.' + severity)}
                </button>
              )
            })}
          </div>

          <div className="mb-1.5 mt-4 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>{t('Risk level (zones)')}</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, riskLevels: [...RISK_LEVELS] })}
              className="text-blue-600 hover:text-blue-500"
            >
              {t('All')}
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
                  {t('risk.' + level)}
                </button>
              )
            })}
          </div>

          <div className="mb-1.5 mt-4 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
            <span>{t('Incident status')}</span>
            <button
              type="button"
              onClick={() => onChange({ ...filters, statuses: [...INCIDENT_STATUSES] })}
              className="text-blue-600 hover:text-blue-500"
            >
              {t('All')}
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
                  className="rounded-full border px-2.5 py-1 t-xs font-semibold transition-colors"
                  style={{
                    borderColor: active ? '#2676D2' : '#D9E2EF',
                    backgroundColor: active ? '#2676D226' : 'transparent',
                    color: active ? '#2676D2' : '#64748B',
                  }}
                >
                  {t('status.' + status)}
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded border border-navy-600 bg-navy-800 px-2.5 py-2">
            <p className="t-xs leading-relaxed text-steel-400">
              {t('Showing')}{' '}
              <span className="font-bold text-steel-100">
                {visibleCount} / {totalCount}
              </span>{' '}
              {t('demo incidents matching the active filters.')}
            </p>
            {relatedCount > 0 ? (
              <p className="mt-1.5 flex items-start gap-1.5 t-xs leading-relaxed text-sky-700">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-sky-400" aria-hidden />
                <span>
                  {t('Includes')}{' '}
                  <span className="font-bold text-sky-800">{relatedCount}</span>{' '}
                  {t('linked incident')}{relatedCount === 1 ? '' : 's'}{' '}
                  {t('from nearby areas — same crime type, within 1.5 km and 72 h.')}
                </span>
              </p>
            ) : null}
            {isDirty ? (
              <button
                type="button"
                onClick={onReset}
                className="mt-1.5 inline-flex items-center gap-1 t-xs font-semibold text-blue-600 hover:text-blue-500"
              >
                <X className="size-3" /> {t('Clear filters')}
              </button>
            ) : null}
          </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('Open crime filters')}
          title={t('Crime filters')}
          className="relative grid size-10 place-items-center rounded-full border border-navy-600 bg-navy-900/95 text-steel-300 shadow-[0_10px_30px_rgba(23,43,77,0.18)] backdrop-blur-sm transition-colors hover:text-steel-100"
        >
          <SlidersHorizontal className="size-5" aria-hidden />
          {isDirty ? (
            <span
              className="absolute right-1.5 top-1.5 size-2 rounded-full bg-blue-400"
              aria-hidden
            />
          ) : null}
        </button>
      )}
    </div>
  )
}
