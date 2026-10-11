import { ShieldCheck } from 'lucide-react'
import type { AppView } from '../types'
import { DemoChip } from './ui/Badge'
import { NAV_ITEMS } from './navItems'

interface SidebarProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
}

/** Persistent desktop navigation rail (shown at lg and above). */
export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside
      className="hidden shrink-0 flex-col border-r border-navy-700 bg-navy-900 lg:flex lg:w-60 xl:w-64"
      aria-label="Primary navigation"
    >
      <div className="flex h-[57px] items-center gap-2.5 border-b border-navy-700 px-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-600 shadow-[0_6px_18px_rgba(26,115,232,0.35)]">
          <ShieldCheck className="size-5 text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold tracking-[0.14em] text-steel-100">
            CRIMEMAP
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-steel-500">
            Puducherry
          </p>
        </div>
      </div>

      <nav className="scroll-thin flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeView
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                  : 'text-steel-300 hover:bg-navy-800 hover:text-steel-100'
              }`}
            >
              <Icon
                className={`size-5 shrink-0 ${active ? 'text-white' : 'text-steel-400'}`}
                aria-hidden
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-navy-700 p-3">
        <DemoChip />
      </div>
    </aside>
  )
}
