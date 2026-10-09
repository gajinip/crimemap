import {
  Brain,
  Car,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flame,
  LayoutDashboard,
  Landmark,
  Map,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useRef, type MouseEvent } from 'react'
import type { AppView } from '../types'

interface NavItem {
  id: AppView
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'map', label: 'Crime Map', icon: Map },
  { id: 'hotspots', label: 'Risk Zones', icon: Flame },
  { id: 'trends', label: 'Crime Trends', icon: TrendingUp },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'predictive-risk', label: 'Risk Forecast', icon: ShieldAlert },
  { id: 'patrol', label: 'Patrol Simulation', icon: Car },
  { id: 'stations', label: 'Police Stations', icon: Landmark },
  { id: 'reports', label: 'Reports', icon: FileText },
]

interface TopNavProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
}

/** Top navigation bar with a horizontally scrollable, click-to-scroll tab strip. */
export function TopNav({ activeView, onNavigate }: TopNavProps) {
  const stripRef = useRef<HTMLDivElement>(null)

  const scrollStrip = (delta: number) => {
    stripRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const handleSelect = (view: AppView, event: MouseEvent<HTMLButtonElement>) => {
    onNavigate(view)
    event.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }

  return (
    <nav className="border-b border-navy-700 bg-navy-900" aria-label="Primary navigation">
      <div className="flex items-center gap-3 px-3 py-3">
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

      <div className="flex items-center gap-1 px-2 pb-2">
        <button
          type="button"
          onClick={() => scrollStrip(-180)}
          aria-label="Scroll navigation left"
          className="grid size-7 shrink-0 place-items-center rounded-full border border-navy-600 text-steel-400 hover:bg-navy-800 hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <div
          ref={stripRef}
          className="scroll-thin flex flex-1 gap-1.5 overflow-x-auto scroll-smooth px-1 py-0.5"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.id === activeView
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={(event) => handleSelect(item.id, event)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  active
                    ? 'border-blue-400 bg-navy-700 text-white'
                    : 'border-navy-600 text-steel-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon
                  className={`size-3.5 shrink-0 ${active ? 'text-blue-400' : 'text-steel-400'}`}
                  aria-hidden
                />
                {item.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollStrip(180)}
          aria-label="Scroll navigation right"
          className="grid size-7 shrink-0 place-items-center rounded-full border border-navy-600 text-steel-400 hover:bg-navy-800 hover:text-white"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  )
}
