import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: string
  color?: string
  icon?: ReactNode
}

export function StatTile({ label, value, hint, color = '#14233B', icon }: StatTileProps) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="t-xs font-bold uppercase tracking-[0.12em] text-steel-400">
            {t(label)}
          </span>
          {icon ? <span className="shrink-0 text-steel-500">{icon}</span> : null}
        </div>
        {hint ? (
          <div className="mt-1 t-xs leading-tight text-steel-500">{t(hint)}</div>
        ) : null}
      </div>
      <div className="shrink-0 text-right text-xl font-bold leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

interface BarRowProps {
  label: string
  value: number
  max: number
  color: string
  meta?: string
}

export function BarRow({ label, value, max, color, meta }: BarRowProps) {
  const { t } = useI18n()
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 t-sm">
        <span className="truncate text-steel-200">{t(label)}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-semibold text-steel-300">{value}</span>
          {meta ? (
            <span className="rounded bg-navy-700 px-1.5 py-0.5 t-xs font-medium text-steel-400">
              {t(meta)}
            </span>
          ) : null}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
