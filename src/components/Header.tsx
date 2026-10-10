import { Bell, Calendar, ChevronDown, MapPin, Search } from 'lucide-react'
import { ALL_AREAS } from '../utils/filters'
import type { DateRange } from '../types'

interface HeaderProps {
  area: string
  areas: string[]
  onAreaChange: (area: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  compact?: boolean
}

const CONTROL_CLASS =
  'h-9 rounded-lg border border-navy-600 bg-navy-800 text-[12px] text-steel-200 outline-none transition-colors hover:border-navy-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40'

export function Header({
  area,
  areas,
  onAreaChange,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  compact = false,
}: HeaderProps) {
  return (
    <header className="border-b border-navy-700 bg-navy-900 px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14px] font-semibold leading-tight tracking-wide text-white sm:text-[15px]">
            Puducherry Crime Intelligence
          </h1>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-steel-400">
            <MapPin className="size-3 shrink-0 text-blue-400" aria-hidden />
            Viewing: <span className="font-semibold text-steel-200">{area}</span>
          </p>
        </div>

        <div className="hidden items-center gap-1 rounded-lg border border-navy-600 bg-navy-800 p-2 text-steel-400 md:flex">
          <Bell className="size-4" aria-hidden />
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 py-1 pl-1 pr-1 sm:pr-3">
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white">
            DA
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[11px] font-semibold text-steel-100">Demo Analyst</span>
            <span className="block text-[10px] text-steel-500">Analysis Cell</span>
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative w-full sm:w-56">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-steel-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search incidents, areas, IDs…"
            aria-label="Search incidents"
            className={`${CONTROL_CLASS} w-full pl-8 pr-3`}
          />
        </label>

        {compact ? null : (
          <>
            <label className="relative w-full sm:w-auto">
              <select
                value={area}
                onChange={(event) => onAreaChange(event.target.value)}
                aria-label="Select area"
                className={`${CONTROL_CLASS} w-full appearance-none py-0 pl-3 pr-8 sm:w-auto`}
              >
                <option value={ALL_AREAS}>{ALL_AREAS}</option>
                {areas.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-steel-400"
                aria-hidden
              />
            </label>

            <div className="flex w-full items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-2.5 py-1.5 sm:w-auto">
              <Calendar className="size-3.5 shrink-0 text-steel-400" aria-hidden />
              <input
                type="date"
                value={dateRange.from}
                max={dateRange.to}
                onChange={(event) => onDateRangeChange({ ...dateRange, from: event.target.value })}
                aria-label="Date range start"
                className="min-w-0 flex-1 bg-transparent text-[11px] text-steel-200 outline-none sm:w-[7.6rem] sm:flex-none"
              />
              <span className="text-[11px] text-steel-500">→</span>
              <input
                type="date"
                value={dateRange.to}
                min={dateRange.from}
                onChange={(event) => onDateRangeChange({ ...dateRange, to: event.target.value })}
                aria-label="Date range end"
                className="min-w-0 flex-1 bg-transparent text-[11px] text-steel-200 outline-none sm:w-[7.6rem] sm:flex-none"
              />
            </div>
          </>
        )}
      </div>
    </header>
  )
}
