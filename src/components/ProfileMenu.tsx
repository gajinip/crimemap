import { ChevronDown, LogOut, Settings, UserCircle } from 'lucide-react'
import { useState } from 'react'

export function ProfileMenu() {
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
        <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-blue-700 text-[12px] font-bold text-white">
          DA
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-[11px] font-semibold text-steel-100">Demo Analyst</span>
          <span className="block text-[10px] text-steel-500">Analysis Cell</span>
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
          className="absolute right-0 top-full z-[1300] mt-2 w-56 overflow-hidden rounded-xl border border-navy-600 bg-navy-800 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-3 border-b border-navy-700 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[14px] font-bold text-white">
              DA
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-steel-100">Demo Analyst</div>
              <div className="truncate text-[10px] text-steel-400">Analysis Cell</div>
              <div className="truncate text-[10px] text-steel-500">demo.analyst@police.gov.in</div>
            </div>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-steel-200 transition-colors hover:bg-navy-700 hover:text-steel-100"
            >
              <UserCircle className="size-4 text-steel-400" aria-hidden />
              View Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-steel-200 transition-colors hover:bg-navy-700 hover:text-steel-100"
            >
              <Settings className="size-4 text-steel-400" aria-hidden />
              Account Settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg border-t border-navy-700 px-3 py-2 text-[12px] text-risk-critical transition-colors hover:bg-navy-700"
            >
              <LogOut className="size-4" aria-hidden />
              Sign Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}