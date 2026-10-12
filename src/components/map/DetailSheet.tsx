import type { ReactNode } from 'react'
import { Sheet } from '../ui/Sheet'

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
 * Detail panel shared by the station, patrol and zone views. Delegates to the
 * responsive `Sheet` shell: a bottom sheet on mobile and a right-side drawer on
 * desktop, anchored inside the map column.
 */
export function DetailSheet({ ariaLabel, header, children, onClose }: DetailSheetProps) {
  return (
    <Sheet ariaLabel={ariaLabel} header={header} onClose={onClose} position="absolute">
      {children}
    </Sheet>
  )
}
