import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface ChartCardProps {
  title?: string
  subtitle?: string
  legend?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/**
 * Shared chart card: standard panel chrome with a prominent card title, a muted
 * subtitle and an optional legend slot. Every chart on every page uses the same
 * shell so the analytics read as one system.
 */
export function ChartCard({
  title,
  subtitle,
  legend,
  children,
  className = '',
  bodyClassName = 'p-4',
}: ChartCardProps) {
  const { t } = useI18n()
  return (
    <section className={`min-w-0 rounded-xl border border-navy-700 bg-navy-850 ${className}`}>
      {/* Header only renders when it actually has content to show. */}
      {title || subtitle || legend ? (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-navy-700 px-4 py-3">
          <div className="min-w-0 break-words">
            {title ? (
              <h2 className="t-sm font-bold uppercase tracking-[0.16em] text-steel-100">
                {t(title)}
              </h2>
            ) : null}
            {subtitle ? <p className="mt-0.5 t-sm text-steel-500">{t(subtitle)}</p> : null}
          </div>
          {/* Legend is pushed to the far right of the header row. */}
          {legend ? <div className="ml-auto shrink-0">{legend}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}