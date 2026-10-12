import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface SheetProps {
  ariaLabel: string
  header: ReactNode
  children: ReactNode
  onClose: () => void
  /**
   * How the panel is positioned. `fixed` anchors it to the viewport (used for
   * page-level panels such as the crime-category details); `absolute` anchors it
   * to the nearest positioned ancestor (used inside the map column).
   */
  position?: 'fixed' | 'absolute'
}

/**
 * Responsive detail panel shared across the app.
 *
 * On small screens it behaves like a bottom sheet (full width, rounded top,
 * grab handle) that slides up; from `lg` upward it becomes a right-side drawer
 * (fixed width, full height) that slides in from the right. A fixed header keeps
 * the title/close control in place while the body scrolls independently.
 */
export function Sheet({ ariaLabel, header, children, onClose, position = 'fixed' }: SheetProps) {
  const { t } = useI18n()
  // Tailwind needs both literals present so it emits the utilities.
  const positionClass = position === 'fixed' ? 'fixed' : 'absolute'

  return (
    <section
      className={`${positionClass} sheet-panel pointer-events-auto inset-x-0 bottom-0 z-[1300] flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-navy-600 bg-navy-900 shadow-[0_-18px_40px_rgba(23,43,77,0.18)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[24rem] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-[-18px_0_50px_rgba(23,43,77,0.18)]`}
      aria-label={ariaLabel}
    >
      {/* Grab handle hints the mobile bottom-sheet affordance; hidden on desktop. */}
      <div className="mx-auto mt-2 h-1 w-11 shrink-0 rounded-full bg-navy-600 lg:hidden" aria-hidden />

      <header className="flex items-start justify-between gap-2 border-b border-navy-700 px-3.5 py-3">
        <div className="min-w-0">{header}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Close details')}
          className="shrink-0 rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-hover hover:text-steel-100"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3.5 py-3">{children}</div>
    </section>
  )
}
