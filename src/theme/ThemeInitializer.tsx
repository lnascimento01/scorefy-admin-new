'use client'

import { useEffect } from 'react'
import { applyDarkTheme } from './dark-theme'
import { applyLightTheme } from './light-theme'

const STORAGE_KEY = 'scorefy-theme'

function resolveInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null
  return media?.matches ? 'dark' : 'light'
}

export function ThemeInitializer() {
  useEffect(() => {
    const theme = resolveInitialTheme()
    if (theme === 'dark') {
      applyDarkTheme()
    } else {
      applyLightTheme()
    }
  }, [])

  return null
}
