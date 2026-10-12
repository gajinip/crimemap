import { Info } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'

type InfoPopoverTone = 'default' | 'risk'

interface InfoPopoverProps {
  /** Explanatory copy shown inside the popup. */
  text: string
  /** Accessible name for the trigger button and popup. */
  label?: string
  /** Visual theme; 'risk' matches the Risk Zones palette. */
  tone?: InfoPopoverTone
}

/**
 * Small info icon that reveals descriptive copy in a popup when tapped.
 * Replaces long in-page paragraphs with a tap-to-open explanation.
 */
export function InfoPopover({ text, label, tone = 'default' }: InfoPopoverProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const id = useId()
  const isRisk = tone === 'risk'
  const resolvedLabel = label ?? t('About this page')

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <span ref={containerRef} className="relative inline-flex align-middle">
      <button
        type="button"
          aria-label={resolvedLabel}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        className={
          isRisk
            ? 'grid size-7 shrink-0 place-items-center rounded-full border text-[#64748B] transition-colors hover:text-[#172B4D]'
            : 'grid size-7 shrink-0 place-items-center rounded-full border border-navy-600 bg-navy-800 text-steel-300 transition-colors hover:border-blue-500/60 hover:text-steel-100'
        }
        style={isRisk ? { borderColor: '#D9E2EF', backgroundColor: '#F4F7FB' } : undefined}
      >
        <Info className="size-4" aria-hidden />
      </button>
      {open ? (
        <div
          id={id}
          role="dialog"
        aria-label={resolvedLabel}
          className={
            isRisk
              ? 'absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border p-3 t-base leading-relaxed text-[#172B4D] shadow-2xl'
              : 'absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-navy-600 bg-navy-850 p-3 t-base leading-relaxed text-steel-200 shadow-2xl'
          }
          style={isRisk ? { borderColor: '#D9E2EF', backgroundColor: '#F4F7FB' } : undefined}
        >
          {text}
        </div>
      ) : null}
    </span>
  )
}