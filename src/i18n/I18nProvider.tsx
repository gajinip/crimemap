import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nValue, type TranslateFn } from './context'
import { setGlobalLocale, translate } from './core'
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales'

const STORAGE_KEY = 'crimemap.locale'

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
    const fromBrowser = window.navigator.language.slice(0, 2)
    if (isLocale(fromBrowser)) return fromBrowser
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return DEFAULT_LOCALE
}

/** Provides the active locale and the `t()` translator to the whole app. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = readInitialLocale()
    // Keep the module-level engine in sync on first render so non-React code
    // (analytics/report builders) sees the same locale immediately.
    setGlobalLocale(initial)
    return initial
  })

  useEffect(() => {
    setGlobalLocale(locale)
    document.documentElement.lang = locale
    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore persistence failures */
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setGlobalLocale(next)
    setLocaleState(next)
  }, [])

  // Stable identity: `translate` reads the current locale from the module-level
  // engine, while the context value below changes when the locale changes, so
  // every consumer re-renders with the new language.
  const t = useCallback<TranslateFn>((key, vars) => translate(key, vars), [])

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
