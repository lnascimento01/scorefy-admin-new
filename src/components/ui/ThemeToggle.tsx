'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from './button'
import { useThemeMode } from '@/theme/useThemeMode'

export function ThemeToggle() {
  const [mode, , toggleTheme] = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Ativar modo ${isDark ? 'claro' : 'escuro'}`}
      className="h-10 w-10 px-0"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
