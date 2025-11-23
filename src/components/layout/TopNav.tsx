'use client'

import { RefreshCcw, Settings2, Bell, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Button } from '../ui/button'
import { useI18n } from '@/lib/i18n'

interface TopNavProps {
  title?: string
  subtitle?: string
  onMenuToggle?: () => void
  onOpenSettings?: () => void
  onRefresh?: () => void
  refreshing?: boolean
  className?: string
}

export function TopNav({
  title,
  subtitle,
  onMenuToggle,
  onOpenSettings,
  onRefresh,
  refreshing,
  className
}: TopNavProps) {
  const { language, setLanguage, availableLanguages } = useI18n()

  const languageButtons = availableLanguages.map(({ code, shortLabel }) => ({
    code,
    label: shortLabel,
    flag: code === 'pt' ? '🇧🇷' : code === 'en' ? '🇺🇸' : '🇪🇸'
  }))

  return (
    <header className={cn('header-panel flex flex-wrap items-center justify-between gap-4 rounded-xl px-4 py-4 shadow-card sm:px-6', className)}>
      <div className="space-y-1">
        {title && <p className="text-xs uppercase tracking-[0.28em] text-textSecondary dark:text-dark-subtitle">{title}</p>}
        {subtitle && <p className="text-xl font-semibold text-textPrimary dark:text-dark-text">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {languageButtons.map(({ code, flag, label }) => {
            const isActive = language === code
            return (
              <Button
                key={code}
                variant={isActive ? 'secondary' : 'outline'}
                size="sm"
                className={cn(
                  'h-10 w-10 px-0 font-semibold',
                  isActive ? 'border-borderSoft bg-card text-accent shadow-card dark:border-dark-border dark:bg-dark-surface2' : '',
                )}
                aria-label={label}
                aria-pressed={isActive}
                onClick={() => {
                  if (!isActive) setLanguage(code)
                }}
              >
                {flag}
              </Button>
            )
          })}
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 px-0"
              onClick={onRefresh}
              aria-label="Atualizar"
              disabled={refreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-10 w-10 px-0" onClick={onOpenSettings} aria-label="Configurações">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-10 px-0" aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-10 w-10 px-0" aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
        {onMenuToggle && (
          <button
            type="button"
            className="rounded-md border border-borderSoft bg-surface-contrast px-3 py-2 text-textPrimary transition hover:border-borderStrong dark:border-dark-border dark:bg-dark-surface dark:text-dark-text lg:hidden"
            onClick={onMenuToggle}
            aria-label="Abrir navegação"
          >
            ☰
          </button>
        )}
      </div>
    </header>
  )
}
