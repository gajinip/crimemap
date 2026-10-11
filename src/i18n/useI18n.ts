import { useContext } from 'react'
import { I18nContext, type I18nValue, type TranslateFn } from './context'

/** Access the active locale and the `t()` translator. */
export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>')
  return value
}

export type { I18nValue, TranslateFn }
