import { MoreHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import type { AppView } from '../types'
import { NAV_ITEMS } from './navItems'

const VISIBLE = NAV_ITEMS.slice(0, 3)
const MORE = NAV_ITEMS.slice(3)

interface BottomNavProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
}

/** Bottom navigation bar pinned while scrolling: first three tabs + a More menu. */
export function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const hasActiveInMore = MORE.some((item) => item.id === activeView)

  const handleSelect = (view: AppView) => {
    setMoreOpen(false)
    onNavigate(view)
  }

const navButtonClass = (active: boolean) =>
  `relative inline-flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors ${
    active ? 'text-blue-600' : 'text-steel-300 hover:text-steel-100'
  }`

  return (
    <nav
      className="sticky bottom-0 z-[2000] border-t border-navy-700 bg-navy-900 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Primary navigation"
    >
      <div className="flex items-center justify-between gap-1.5 px-3 py-2">
        {VISIBLE.map((item) => {
          const active = item.id === activeView
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              className={navButtonClass(active)}
            >
              <Icon
                className={`size-6 shrink-0 ${active ? 'text-blue-400' : 'text-steel-400'}`}
                aria-hidden
              />
              <span
                className={`w-full truncate text-center text-[10px] font-semibold leading-none ${
                  active ? 'text-blue-400' : 'text-steel-300'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label={moreOpen ? 'Close more menu' : 'More'}
            title="More"
            className={navButtonClass(moreOpen)}
          >
            {moreOpen ? (
              <X className="size-6 text-steel-300" aria-hidden />
            ) : (
              <MoreHorizontal className="size-6 text-steel-300" aria-hidden />
            )}
            {hasActiveInMore ? (
              <span
                className="absolute right-4 top-1 size-2 rounded-full bg-blue-400"
                aria-hidden
              />
            ) : null}
            <span className="w-full truncate text-center text-[10px] font-semibold leading-none text-steel-300">
              More
            </span>
          </button>

          {moreOpen ? (
            <div
              role="menu"
              className="absolute bottom-full right-0 mb-2 w-[238px] rounded-xl border border-navy-600 bg-navy-800 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="grid grid-cols-3 gap-1">
                {MORE.map((item) => {
                  const active = item.id === activeView
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelect(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition-colors ${
                        active
                          ? 'bg-navy-700 text-blue-600'
                          : 'text-steel-300 hover:bg-navy-700 hover:text-steel-100'
                      }`}
                    >
                      <Icon
                        className={`size-5 ${active ? 'text-blue-400' : 'text-steel-400'}`}
                        aria-hidden
                      />
                      <span className="w-full truncate text-center text-[10px] font-semibold leading-none">
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  )
}