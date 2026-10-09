import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = 'p-4' }: PanelProps) {
  return (
    <section className={`rounded-xl border border-navy-700 bg-navy-850 ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-navy-700 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-steel-300">
            {title}
          </h2>
          {subtitle ? <p className="mt-0.5 text-[11px] text-steel-500">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
