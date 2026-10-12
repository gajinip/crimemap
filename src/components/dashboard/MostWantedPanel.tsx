import { BadgeAlert, MapPin } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n'
import { MOST_WANTED, type MostWantedEntry } from '../../data/mostWanted'
import { RISK_LEVEL_BADGE } from '../../utils/riskPalette'
import { CRIME_CATEGORY_COLORS } from '../../utils/visuals'

const rewardFormatter = new Intl.NumberFormat('en-IN')

/** Initials for the avatar circle, e.g. "D. Karthik" -> "DK". */
function initialsOf(name: string): string {
  const parts = name.replace(/\./g, ' ').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase()
}

/** One most-wanted suspect card. */
function WantedCard({ entry }: { entry: MostWantedEntry }) {
  const { t } = useI18n()
  const accent = CRIME_CATEGORY_COLORS[entry.crime]
  const arrested = entry.status === 'Arrested'

  return (
    <li className="flex gap-3 rounded-xl border border-navy-700 bg-navy-800/60 p-3">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full t-sm font-bold"
        style={{ backgroundColor: `${accent}1f`, color: accent }}
        aria-hidden
      >
        {initialsOf(entry.name)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="t-base font-semibold text-steel-100">
            {entry.name}
            {entry.alias ? <span className="ml-1 text-steel-400">“{entry.alias}”</span> : null}
          </p>
          <span
            className="rounded-full px-1.5 py-px t-2xs font-bold uppercase tracking-[0.08em]"
            style={{ color: accent, backgroundColor: `${accent}1f` }}
          >
            {t('category.' + entry.crime)}
          </span>
          <span className="rounded-full border border-navy-600 px-1.5 py-px t-2xs font-semibold uppercase tracking-[0.08em] text-steel-400">
            {RISK_LEVEL_BADGE[entry.riskLevel]}
          </span>
          {arrested ? (
            <span className="rounded-full bg-risk-low/15 px-1.5 py-px t-2xs font-bold uppercase tracking-[0.08em] text-risk-low">
              {t('Arrested')}
            </span>
          ) : null}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 t-xs text-steel-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {t(entry.lastSeenArea)}
          </span>
          <span>
            {t('Last seen')} {entry.lastSeenAt}
          </span>
          {entry.age !== null ? <span>{entry.age} {t('yrs')}</span> : null}
        </p>

        <p className="mt-1 line-clamp-2 t-xs leading-relaxed text-steel-400">{entry.description}</p>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="font-mono t-2xs text-steel-500">{entry.id}</span>
          {entry.reward > 0 ? (
            <span className="t-xs font-semibold text-amber-700">
              ₹{rewardFormatter.format(entry.reward)} {t('reward')}
            </span>
          ) : (
            <span className="t-xs text-steel-500">{t('No reward')}</span>
          )}
        </div>
      </div>
    </li>
  )
}

/**
 * Dashboard most-wanted board.
 *
 * Purely a demo surface: entries come from the fictional `MOST_WANTED` dataset
 * and no personal data of real individuals is shown.
 */
export function MostWantedPanel() {
  const { t } = useI18n()

  return (
    <section className="rounded-xl border border-navy-700 bg-navy-850 p-3.5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-risk-critical/10 text-risk-critical">
          <BadgeAlert className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="t-base font-bold text-steel-100">{t('Most wanted')}</h2>
          <p className="t-xs text-steel-400">{t('Suspects sought by the department')}</p>
        </div>
      </div>

      <ul className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {MOST_WANTED.map((entry) => (
          <WantedCard key={entry.id} entry={entry} />
        ))}
      </ul>

      <p className="mt-3 text-center t-2xs font-bold uppercase tracking-[0.08em] text-amber-700">
        {t('DEMO DATA - NOT REAL CRIME INFORMATION')}
      </p>
    </section>
  )
}
