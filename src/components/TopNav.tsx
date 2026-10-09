import {
  Brain,
  Car,
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
import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
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

interface DragState {
  pointerId: number
  startX: number
  startScroll: number
  moved: boolean
}

/** Top navigation bar with a swipe/drag-scrollable tab strip. */
export function TopNav({ activeView, onNavigate }: TopNavProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const didDragRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    didDragRef.current = false
    if (event.pointerType !== 'mouse') return
    const strip = stripRef.current
    if (!strip) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: strip.scrollLeft,
      moved: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    const strip = stripRef.current
    if (!state || !strip || state.pointerId !== event.pointerId) return
    const delta = event.clientX - state.startX
    if (!state.moved && Math.abs(delta) > 4) {
      state.moved = true
      setDragging(true)
      strip.setPointerCapture(event.pointerId)
    }
    if (state.moved) strip.scrollLeft = state.startScroll - delta
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current
    const strip = stripRef.current
    if (!state || !strip || state.pointerId !== event.pointerId) return
    if (state.moved) {
      didDragRef.current = true
      strip.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setDragging(false)
  }

  const handleSelect = (view: AppView, event: MouseEvent<HTMLButtonElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
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

      <div className="pb-2">
        <div
          ref={stripRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`scroll-thin flex touch-pan-x select-none gap-1.5 overflow-x-auto px-3 py-0.5 ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
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
      </div>
    </nav>
  )
}
