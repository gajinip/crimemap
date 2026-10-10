import { Bell } from 'lucide-react'

export function Header() {
  return (
    <header className="flex items-center justify-end border-b border-navy-700 bg-navy-900 px-3 py-3 sm:px-4">
      <div className="hidden items-center gap-1 rounded-lg border border-navy-600 bg-navy-800 p-2 text-steel-400 md:flex">
        <Bell className="size-4" aria-hidden />
      </div>
    </header>
  )
}