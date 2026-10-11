import { Maximize2, Minimize2, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface DetailSheetProps {
  ariaLabel: string
  header: ReactNode
  children: ReactNode
  onClose: () => void
}

/** One label/value row inside a detail sheet card. */
export function SheetRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-navy-600 py-1.5 t-sm last:border-b-0">
      <span className="shrink-0 text-steel-500">{label}</span>
      <span className={`text-right font-medium text-steel-100${mono ? ' font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

/** Amber "demo data" notice shared by the non-incident detail sheets. */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="py-1.5 text-center t-xs font-bold uppercase tracking-[0.08em] text-amber-700">
      {children}
    </p>
  )
}

/**
 * Google-Maps-style bottom sheet shell. Mirrors the incident sheet: slides up
 * from the bottom, can expand to full screen, and can be dismissed.
 */
export function DetailSheet({ ariaLabel, header, children, onClose }: DetailSheetProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)

  return (
    <section
      className={`incident-sheet-in pointer-events-auto scroll-thin absolute bottom-0 z-[1300] overflow-y-auto border-t border-navy-600 bg-navy-900/97 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-[border-radius] duration-200 ${
        expanded
          ? 'left-0 right-0 top-0 rounded-none'
          : 'left-0 right-0 max-h-[75%] rounded-t-3xl'
      }`}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-label={expanded ? t('Collapse details') : t('Expand details')}
        className="mx-auto mt-2 flex h-6 w-12 items-center justify-center rounded-full"
      >
        <span className="h-1 w-9 rounded-full bg-navy-500 transition-colors hover:bg-navy-400" aria-hidden />
      </button>

      <header className="flex items-start justify-between gap-2 px-3.5 pb-1.5 pt-1">
        <div className="min-w-0">{header}</div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-label={expanded ? t('Collapse details') : t('Expand details')}
            title={expanded ? t('Collapse') : t('Expand to full screen')}
            className="rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
          >
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close details')}
            className="shrink-0 rounded-lg p-1.5 text-steel-400 transition-colors hover:bg-navy-700 hover:text-steel-100"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div className="px-3.5 pb-3">{children}</div>
    </section>
  )
}
