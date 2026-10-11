import { ShieldCheck, X } from 'lucide-react'
import { ProfileMenu } from './ProfileMenu'

interface TopNavProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TopNav({ searchQuery, onSearchChange }: TopNavProps) {
  return (
    <nav className="bg-navy-900" aria-label="Primary header">
      <div className="flex items-center gap-2.5 border-b border-navy-700 px-3 py-2.5">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-navy-600 bg-navy-800 pl-1.5 pr-2 transition-colors hover:border-navy-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-600 shadow-[0_6px_18px_rgba(26,115,232,0.35)]">
            <ShieldCheck className="size-4 text-white" aria-hidden />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search incidents, areas, IDs…"
            aria-label="Search incidents"
            className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-steel-100 outline-none placeholder:text-steel-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="grid size-7 shrink-0 place-items-center rounded-full text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>
        <ProfileMenu />
      </div>
    </nav>
  )
}