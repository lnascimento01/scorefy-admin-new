'use client'

import { RefreshCcw, Settings2, Bell, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Button } from '../ui/button'
import { useI18n } from '@/lib/i18n'

interface TopNavProps {
  title?: string
  subtitle?: string
  userName?: string
  userEmail?: string
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
    <header className={cn('header-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-4 sm:px-6', className)}>
      <div className="space-y-1">
        {title && <p className="text-xs uppercase tracking-[0.28em] text-textMuted">{title}</p>}
        {subtitle && <p className="text-xl font-semibold text-textPrimary">{subtitle}</p>}
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
                  isActive ? 'border-[color:var(--brand-soft-border)] bg-[var(--brand-soft)] text-primary' : '',
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
            className="rounded-xl border border-borderSofter bg-surface-contrast px-3 py-2 text-textPrimary transition hover:bg-surface-elevated lg:hidden"
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
