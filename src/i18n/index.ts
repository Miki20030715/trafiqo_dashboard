import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import hu from './hu.json'
import en from './en.json'

export const LANGUAGES = ['hu', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'trafiqo.lang'

function initialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'hu' || stored === 'en') return stored
  }
  // Default language is Hungarian per the brief.
  return 'hu'
}

i18n.use(initReactI18next).init({
  resources: {
    hu: { translation: hu },
    en: { translation: en },
  },
  lng: initialLanguage(),
  fallbackLng: 'hu',
  interpolation: { escapeValue: false },
  returnNull: false,
})

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lng)
    document.documentElement.lang = lng
  }
})

// Keep <html lang> in sync on first load.
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language
}

export default i18n
