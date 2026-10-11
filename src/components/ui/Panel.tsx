import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface PanelProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = 'p-4' }: PanelProps) {
  const { t } = useI18n()
  return (
    <section className={`min-w-0 rounded-xl border border-navy-700 bg-navy-850 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-navy-700 px-4 py-3">
        <div className="min-w-0 break-words flex-[1_1_12rem]">
          <h2 className="t-sm font-bold uppercase tracking-[0.16em] text-steel-300">
            {t(title)}
          </h2>
          {subtitle ? <p className="mt-0.5 t-sm text-steel-500">{t(subtitle)}</p> : null}
        </div>
        <div className="shrink-0">{actions}</div>
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
