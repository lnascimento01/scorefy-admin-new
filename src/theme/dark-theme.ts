'use client'

import { palette, semanticTokens, shadows, ThemeName } from './tailwind.tokens'

export type ThemeMode = ThemeName

export const darkTheme = {
  name: 'dark' as ThemeMode,
  colors: palette.dark,
  surfaces: semanticTokens.dark,
  shadows
}

export function applyDarkTheme() {
  document.documentElement.dataset.theme = 'dark'
  document.documentElement.classList.add('dark')
  document.documentElement.classList.remove('light')
}
