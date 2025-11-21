'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations, type Language, type TranslationRecord } from './translations'

const STORAGE_KEY = 'scorefy:locale'

interface I18nContextValue {
  language: Language
  dictionary: TranslationRecord
  setLanguage: (language: Language) => void
  t: (path: string) => string
  availableLanguages: Array<{ code: Language; label: string; shortLabel: string }>
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'pt'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored && stored in translations) return stored
  const browserLang = window.navigator.language?.slice(0, 2).toLowerCase()
  if (browserLang === 'en' || browserLang === 'es' || browserLang === 'pt') {
    return browserLang
  }
  return 'pt'
}

function translate(dictionary: TranslationRecord, path: string) {
  return path
    .split('.')
    .reduce<unknown>((acc, segment) => {
      if (!acc || typeof acc !== 'object' || !(segment in acc)) {
        return undefined
      }
      return (acc as Record<string, unknown>)[segment]
    }, dictionary) as string | undefined
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'pt'
    return getInitialLanguage()
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
  }, [])

  const dictionary = translations[language]

  const t = useCallback(
    (path: string) => {
      const value = translate(dictionary, path)
      return value ?? path
    },
    [dictionary],
  )

  const availableLanguages = useMemo(
    () =>
      (Object.keys(translations) as Language[]).map((code) => ({
        code,
        label: translations[code].language.label,
        shortLabel: translations[code].language.shortLabel
      })),
    [],
  )

  const value = useMemo<I18nContextValue>(
    () => ({ language, dictionary, setLanguage, t, availableLanguages }),
    [language, dictionary, setLanguage, t, availableLanguages],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
