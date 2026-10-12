import { ShieldCheck } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { AppView } from '../types'
import { NAV_ITEMS } from './navItems'

interface SidebarProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
}

/** Persistent desktop navigation rail (shown at lg and above). */
export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const { t } = useI18n()
  return (
    <aside
      className="hidden shrink-0 flex-col border-r border-white/10 bg-police-navy lg:flex lg:w-60 xl:w-64 print:hidden"
      aria-label={t('Primary navigation')}
    >
      <div className="flex h-[57px] items-center gap-2.5 border-b border-white/10 px-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-police-blue shadow-[0_6px_18px_rgba(38,118,210,0.45)]">
          <ShieldCheck className="size-5 text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate t-md font-bold tracking-[0.14em] text-white">
            CRIMEMAP
          </p>
          <p className="truncate t-xs uppercase tracking-[0.16em] text-white/60">
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
              aria-label={t(item.label)}
              title={t(item.label)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left t-base font-semibold transition-colors ${
                active
                  ? 'bg-police-blue text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon
                className={`size-5 shrink-0 ${active ? 'text-white' : 'text-white/60'}`}
                aria-hidden
              />
              <span className="truncate">{t(item.label)}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
