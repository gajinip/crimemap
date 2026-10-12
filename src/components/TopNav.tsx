import { ShieldCheck, X } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import type { AuthUser } from '../auth/auth'
import type { AppView } from '../types'
import type { CriticalAlert } from '../utils/alerts'
import { LanguageSelect } from './LanguageSelect'
import { NAV_ITEMS } from './navItems'
import { NotificationBell } from './NotificationBell'
import { ProfileMenu } from './ProfileMenu'

interface TopNavProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  /** Active destination, shown as page context in the header. */
  activeView: AppView
  /** Critical-incident alerts surfaced through the notification bell. */
  alerts: CriticalAlert[]
  /** Jump to the crime map (used by the notification drawer actions). */
  onOpenMap: () => void
  /** Signed-in user shown in the profile menu. */
  user: AuthUser
  /** Clears the demo session and returns to the sign-in screen. */
  onSignOut: () => void
}

export function TopNav({
  searchQuery,
  onSearchChange,
  activeView,
  alerts,
  onOpenMap,
  user,
  onSignOut,
}: TopNavProps) {
  const { t } = useI18n()
  const activeLabel = NAV_ITEMS.find((item) => item.id === activeView)?.label ?? 'Dashboard'

  return (
    <nav className="bg-navy-900 print:hidden" aria-label={t('Primary header')}>
      <div className="flex items-center gap-2 border-b border-navy-700 px-3 py-2.5">
        <div className="hidden min-w-0 shrink-0 lg:block">
          <p className="truncate t-xs uppercase tracking-[0.18em] text-steel-400">CRIMEMAP</p>
          <p className="truncate t-base font-bold text-steel-100">{t(activeLabel)}</p>
        </div>
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-navy-600 bg-navy-800 pl-1.5 pr-2 transition-colors hover:border-navy-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-600 shadow-[0_6px_18px_rgba(26,115,232,0.35)]">
            <ShieldCheck className="size-4 text-white" aria-hidden />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('Search incidents, areas, IDs…')}
            aria-label={t('Search incidents')}
            className="h-full min-w-0 flex-1 bg-transparent t-base text-steel-100 outline-none placeholder:text-steel-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t('Clear search')}
              className="grid size-7 shrink-0 place-items-center rounded-full text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>
        <NotificationBell alerts={alerts} onOpenMap={onOpenMap} />
        <LanguageSelect />
        <ProfileMenu user={user} onSignOut={onSignOut} />
      </div>
    </nav>
  )
}