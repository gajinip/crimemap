import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { t } = useI18n()
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-wide text-steel-100">{t(title)}</h2>
        {subtitle ? <p className="mt-1 t-base text-steel-400">{t(subtitle)}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
