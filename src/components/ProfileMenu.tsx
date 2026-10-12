import { ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react'
import { useState } from 'react'
import type { AuthUser } from '../auth/auth'
import { useI18n } from '../i18n/useI18n'

interface ProfileMenuProps {
  /** Signed-in user whose name/role/email populate the menu. */
  user: AuthUser
  /** Clears the demo session; wired to the Sign Out item. */
  onSignOut: () => void
}

export function ProfileMenu({ user, onSignOut }: ProfileMenuProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 py-1 pl-1 pr-1 transition-colors hover:border-navy-500 sm:pr-3"
      >
        <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 t-base font-bold text-white">
          {user.initials}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block t-sm font-semibold text-steel-100">{user.name}</span>
              <span className="block t-xs text-steel-500">{t(user.role)}</span>
        </span>
        <ChevronDown
          className={`hidden size-3.5 text-steel-400 transition-transform sm:block ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-[1300] mt-2 w-56 overflow-hidden rounded-xl border border-navy-600 bg-navy-800 shadow-[0_16px_40px_rgba(23,43,77,0.2)]"
        >
          <div className="flex items-center gap-3 border-b border-navy-700 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 t-md font-bold text-white">
              {user.initials}
            </span>
            <div className="min-w-0">
              <div className="truncate t-base font-semibold text-steel-100">{user.name}</div>
              <div className="truncate t-xs text-steel-400">{t(user.role)}</div>
              <div className="truncate t-xs text-steel-500">
                {user.stationName} · {user.deptId}
              </div>
              <div className="truncate t-xs text-steel-500">{user.email}</div>
            </div>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 t-base text-steel-200 transition-colors hover:bg-navy-700 hover:text-steel-100"
            >
              <UserCircle className="size-4 text-steel-400" aria-hidden />
               {t('View Profile')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 t-base text-steel-200 transition-colors hover:bg-navy-700 hover:text-steel-100"
            >
              <Settings className="size-4 text-steel-400" aria-hidden />
               {t('Account Settings')}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg border-t border-navy-700 px-3 py-2 t-base text-risk-critical transition-colors hover:bg-navy-700"
            >
              <LogOut className="size-4" aria-hidden />
               {t('Sign Out')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}