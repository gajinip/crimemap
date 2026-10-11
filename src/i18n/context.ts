import { createContext } from 'react'
import type { TranslateVars } from './core'
import type { Locale } from './locales'

export type TranslateFn = (key: string, vars?: TranslateVars) => string

export interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslateFn
}

export const I18nContext = createContext<I18nValue | null>(null)
