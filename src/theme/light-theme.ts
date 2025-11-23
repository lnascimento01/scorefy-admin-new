'use client'

import { palette, semanticTokens, shadows, ThemeName } from './tailwind.tokens'

export type ThemeMode = ThemeName

export const lightTheme = {
  name: 'light' as ThemeMode,
  colors: palette.light,
  surfaces: semanticTokens.light,
  shadows
}

export function applyLightTheme() {
  document.documentElement.dataset.theme = 'light'
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
}
