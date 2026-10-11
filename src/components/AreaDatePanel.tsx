import { Calendar, MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import type { DateRange } from '../types'
import { ALL_AREAS, DATA_MAX_DATE, timePresets } from '../utils/filters'

interface AreaDatePanelProps {
  area: string
  areas: string[]
  dateRange: DateRange
  onAreaChange: (area: string) => void
  onDateRangeChange: (range: DateRange) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PRESETS = timePresets()

const CONTROL_CLASS =
  'w-full rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-2 t-base text-steel-200 outline-none transition-colors hover:border-navy-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'

/** Single map control for the area and date-range filters. */
export function AreaDatePanel({
  area,
  areas,
  dateRange,
  onAreaChange,
  onDateRangeChange,
  open: openProp,
  onOpenChange,
}: AreaDatePanelProps) {
  const { t } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const [mode, setMode] = useState<'day' | 'range'>(
    dateRange.from === dateRange.to ? 'day' : 'range',
  )

  const activePreset = PRESETS.find(
    (preset) =>
      preset.range.from === dateRange.from && preset.range.to === dateRange.to,
  )?.label

  const isAreaFiltered = area !== ALL_AREAS

  return (
    <div className="pointer-events-auto absolute left-14 top-2 z-[1200] sm:left-[3.75rem]">
      {open ? (
        <div className="w-[calc(100vw-16px)] max-w-[290px] rounded-lg border border-navy-600 bg-navy-900/95 shadow-[0_12px_34px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-navy-700 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 t-xs font-bold uppercase tracking-[0.16em] text-steel-300">
              <MapPin className="size-3.5 text-blue-400" aria-hidden />
              {t('Area & date')}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('Close area and date filters')}
              className="rounded p-1 text-steel-400 hover:bg-navy-700 hover:text-steel-100"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="scroll-thin max-h-[55vh] overflow-y-auto px-3 py-3 sm:max-h-[68vh]">
            <div className="mb-1.5 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
              <span>{t('Area')}</span>
            </div>
            <select
              value={area}
              onChange={(event) => onAreaChange(event.target.value)}
              aria-label={t('Select area')}
              className={`${CONTROL_CLASS} appearance-none`}
            >
              <option value={ALL_AREAS}>{t('All Areas')}</option>
              {areas.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="mb-1.5 mt-4 flex items-center justify-between t-2xs font-bold uppercase tracking-[0.14em] text-steel-500">
              <span>{t('Date')}</span>
              <span className="normal-case tracking-normal text-steel-600">
                {mode === 'day'
                  ? dateRange.from
                  : `${dateRange.from} → ${dateRange.to}`}
              </span>
            </div>

            <div className="mb-2 inline-flex rounded-lg border border-navy-600 bg-navy-800 p-0.5">
              {(['day', 'range'] as const).map((option) => {
                const active = mode === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setMode(option)
                      if (option === 'day') {
                        onDateRangeChange({
                          from: dateRange.from,
                          to: dateRange.from,
                        })
                      }
                    }}
                    aria-pressed={active}
                    className={`rounded-md px-2.5 py-1 t-xs font-semibold transition-colors ${
                      active ? '' : 'text-steel-500 hover:text-steel-300'
                    }`}
                    style={
                      active
                        ? { backgroundColor: '#1A73E81f', color: '#1A73E8' }
                        : undefined
                    }
                  >
                    {option === 'day' ? t('Single day') : t('Range')}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5">
              <Calendar className="size-3.5 shrink-0 text-steel-400" aria-hidden />
              {mode === 'day' ? (
                <input
                  type="date"
                  value={dateRange.from}
                  max={DATA_MAX_DATE}
                  onChange={(event) =>
                    onDateRangeChange({
                      from: event.target.value,
                      to: event.target.value,
                    })
                  }
                  aria-label={t('Select a single day')}
                  className="min-w-0 flex-1 bg-transparent t-sm text-steel-200 outline-none"
                />
              ) : (
                <>
                  <input
                    type="date"
                    value={dateRange.from}
                    max={dateRange.to}
                    onChange={(event) =>
                      onDateRangeChange({ ...dateRange, from: event.target.value })
                    }
                    aria-label={t('Date range start')}
                    className="min-w-0 flex-1 bg-transparent t-sm text-steel-200 outline-none"
                  />
                  <span className="t-sm text-steel-500">→</span>
                  <input
                    type="date"
                    value={dateRange.to}
                    min={dateRange.from}
                    max={DATA_MAX_DATE}
                    onChange={(event) =>
                      onDateRangeChange({ ...dateRange, to: event.target.value })
                    }
                    aria-label={t('Date range end')}
                    className="min-w-0 flex-1 bg-transparent t-sm text-steel-200 outline-none"
                  />
                </>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => {
                const active = activePreset === preset.label
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onDateRangeChange(preset.range)
                      setMode(
                        preset.range.from === preset.range.to ? 'day' : 'range',
                      )
                    }}
                    aria-pressed={active}
                    className={`rounded-full border px-2.5 py-1 t-xs font-semibold transition-colors ${
                      active
                        ? ''
                        : 'border-navy-600 text-steel-500 hover:border-navy-500'
                    }`}
                    style={
                      active
                        ? {
                            borderColor: '#1A73E8',
                            backgroundColor: '#1A73E826',
                            color: '#1A73E8',
                          }
                        : undefined
                    }
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('Open area and date filters')}
          title={t('Area & date filters')}
          className="relative grid size-10 place-items-center rounded-full border border-navy-600 bg-navy-900/95 text-steel-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-colors hover:text-steel-100"
        >
          <MapPin className="size-5" aria-hidden />
          {isAreaFiltered ? (
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