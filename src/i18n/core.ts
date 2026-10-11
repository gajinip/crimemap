import { DEFAULT_LOCALE, isLocale, type Locale } from './locales'
import { messages } from './translations'

/**
 * Module-level translation engine.
 *
 * The English string is used as the translation key, so `translate` falls back
 * to the key itself whenever a locale does not provide an override. That keeps
 * English as the guaranteed source of truth (and keeps the test suites, which
 * assert English, deterministic) while other locales progressively override.
 */

let currentLocale: Locale = DEFAULT_LOCALE

export function setGlobalLocale(locale: Locale): void {
  if (isLocale(locale)) currentLocale = locale
}

export function getGlobalLocale(): Locale {
  return currentLocale
}

export type TranslateVars = Record<string, string | number>

/**
 * Namespaced keys (`category.Theft`, `risk.High`, ...). When a locale has no
 * override, the bare value after the dot is a correct English fallback, so the
 * UI never shows a raw prefixed key.
 */
const NAMESPACED_KEY = /^(?:category|status|risk|severity|trend|hotspot|patrol|prediction)\.(.+)$/

/** Translate a key, interpolating `{name}` placeholders from `vars`. */
export function translate(key: string, vars?: TranslateVars): string {
  let output = messages[currentLocale]?.[key]
  if (output === undefined) {
    const match = NAMESPACED_KEY.exec(key)
    output = match ? match[1] : key
  }
  if (vars) {
    for (const name of Object.keys(vars)) {
      output = output.split(`{${name}}`).join(String(vars[name]))
    }
  }
  return output
}
