import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'
import type { DateRange } from '../../types'

interface DateFilterBarProps {
  range: DateRange
  compareRange: DateRange | null
  onCompareRangeChange: (range: DateRange | null) => void
  className?: string
}

/** Day / Range comparison-window selector shown above the headline indicators. */
export function DateFilterBar({
  range,
  compareRange,
  onCompareRangeChange,
  className = '',
}: DateFilterBarProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<'day' | 'range'>(
    compareRange && compareRange.from === compareRange.to ? 'day' : 'range',
  )
  const [customFrom, setCustomFrom] = useState(compareRange?.from ?? range.to)
  const [customTo, setCustomTo] = useState(compareRange?.to ?? range.to)
  const customActive = compareRange !== null

  const selectDay = () => {
    if (customActive && mode === 'day') {
      onCompareRangeChange(null)
      return
    }
    setMode('day')
    setCustomTo(customFrom)
    onCompareRangeChange({ from: customFrom, to: customFrom })
  }

  const selectRange = () => {
    if (customActive && mode === 'range') {
      onCompareRangeChange(null)
      return
    }
    setMode('range')
    const safeFrom = customFrom <= customTo ? customFrom : customTo
    const safeTo = customFrom <= customTo ? customTo : customFrom
    setCustomFrom(safeFrom)
    setCustomTo(safeTo)
    onCompareRangeChange({ from: safeFrom, to: safeTo })
  }

  const clearCustom = () => onCompareRangeChange(null)

  const applyDay = (day: string) => {
    setCustomFrom(day)
    setCustomTo(day)
    onCompareRangeChange({ from: day, to: day })
  }

  const applyCustom = (from: string, to: string) => {
    setCustomFrom(from)
    setCustomTo(to)
    const safeFrom = from <= to ? from : to
    const safeTo = from <= to ? to : from
    onCompareRangeChange({ from: safeFrom, to: safeTo })
  }

  const dateInputClass =
    'min-w-0 rounded-lg border border-navy-600 bg-navy-950 px-2 py-1.5 t-base text-steel-100 focus:border-blue-500 focus:outline-none'

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 ${className}`}
      aria-label={t('Date filter')}
    >
        <button
          type="button"
          onClick={selectDay}
          aria-pressed={customActive && mode === 'day'}
          title={t('View a single day')}
          className={`rounded-full border px-2.5 py-1 t-base font-bold transition-colors ${
            customActive && mode === 'day'
              ? 'border-blue-500 bg-blue-600 text-white'
              : 'border-navy-600 bg-navy-800 text-steel-300 hover:text-steel-100'
          }`}
        >
          {t('Day')}
        </button>
        <button
          type="button"
          onClick={selectRange}
          aria-pressed={customActive && mode === 'range'}
          title={t('View a date range')}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 t-base font-bold transition-colors ${
            customActive && mode === 'range'
              ? 'border-blue-500 bg-blue-600 text-white'
              : 'border-navy-600 bg-navy-800 text-steel-300 hover:text-steel-100'
          }`}
        >
          <CalendarDays className="size-3.5" aria-hidden /> {t('Range')}
        </button>

        {customActive && mode === 'day' ? (
          <input
            type="date"
            value={customFrom}
            min={range.from}
            max={range.to}
            onChange={(event) => applyDay(event.target.value)}
            aria-label={t('View date')}
            className={dateInputClass}
          />
        ) : null}

        {customActive && mode === 'range' ? (
          <span className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customFrom}
              min={range.from}
              max={customTo}
              onChange={(event) => applyCustom(event.target.value, customTo)}
              aria-label={t('View from date')}
              className={dateInputClass}
            />
            <span className="t-sm text-steel-500">{t('to')}</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={range.to}
              onChange={(event) => applyCustom(customFrom, event.target.value)}
              aria-label={t('View to date')}
              className={dateInputClass}
            />
          </span>
        ) : null}

        {customActive ? (
          <button
            type="button"
            onClick={clearCustom}
            aria-label={t('Clear date filter')}
            title={t('Clear')}
            className="rounded-full bg-navy-800 px-2 py-1 t-base font-bold text-steel-300 transition-colors hover:text-steel-100"
          >
            ✕
          </button>
        ) : null}
    </div>
  )
}
