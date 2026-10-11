/** Supported interface locales for CrimeMap. */
export type Locale = 'en' | 'ta' | 'fr'

export interface LocaleOption {
  id: Locale
  /** Name shown in the language menu, in that language. */
  native: string
  /** English name, used for aria labels and tooltips. */
  english: string
}

export const LOCALES: LocaleOption[] = [
  { id: 'en', native: 'English', english: 'English' },
  { id: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { id: 'fr', native: 'Français', english: 'French' },
]

export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'ta' || value === 'fr'
}
