import { Languages } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'
import { LOCALES, type Locale } from '../i18n/locales'

/** Compact locale switcher (English / Tamil / French) for the top bar. */
export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n()

  return (
    <label
      className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-navy-600 bg-navy-800 pl-3 pr-2 transition-colors hover:border-navy-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40"
      title={t('Language')}
    >
      <Languages className="size-4 shrink-0 text-steel-400" aria-hidden />
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t('Language')}
        className="h-full cursor-pointer appearance-none bg-transparent pr-1 t-base font-semibold text-steel-200 outline-none"
      >
        {LOCALES.map((option) => (
          <option key={option.id} value={option.id} className="text-steel-100">
            {option.native}
          </option>
        ))}
      </select>
    </label>
  )
}
