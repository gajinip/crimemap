import { Search, ShieldCheck } from 'lucide-react'
import { ProfileMenu } from './ProfileMenu'

interface TopNavProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TopNav({ searchQuery, onSearchChange }: TopNavProps) {
  return (
    <nav className="bg-navy-900" aria-label="Primary header">
      <div className="flex items-center justify-between gap-3 border-b border-navy-700 px-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 shadow-[0_6px_18px_rgba(37,99,235,0.35)]">
            <ShieldCheck className="size-5 text-white" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold leading-none tracking-[0.18em] text-white">
              CRIMEMAP
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-steel-400">
              Crime Intelligence
            </div>
          </div>
        </div>
        <ProfileMenu />
      </div>

      <div className="border-b border-navy-700 px-3 py-2.5">
        <label className="relative block">
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
            className="h-9 w-full rounded-lg border border-navy-600 bg-navy-800 pl-8 pr-3 text-[12px] text-steel-200 outline-none transition-colors hover:border-navy-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
          />
        </label>
      </div>
    </nav>
  )
}