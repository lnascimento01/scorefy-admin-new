'use client'

import { useCallback, useEffect, useState } from 'react'
import { applyDarkTheme } from './dark-theme'
import { applyLightTheme } from './light-theme'

const STORAGE_KEY = 'scorefy-theme'

export type ThemeMode = 'light' | 'dark'

function applyTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    applyDarkTheme()
  } else {
    applyLightTheme()
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void, () => void] {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  const setTheme = useCallback((next: ThemeMode) => {
    setMode(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(mode === 'dark' ? 'light' : 'dark')
  }, [mode, setTheme])

  return [mode, setTheme, toggleTheme]
}
