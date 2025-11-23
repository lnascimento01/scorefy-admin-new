'use client'

import type { Dispatch, SetStateAction } from 'react'
import { X, Bell, LayoutTemplate, SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Button } from '../ui/button'
import { Tabs } from '../ui/Tabs'
import { useThemeMode } from '@/theme/useThemeMode'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  setDensity?: Dispatch<SetStateAction<'comfortable' | 'compact'>>
}

export function SettingsPanel({ open, onClose, setDensity }: SettingsPanelProps) {
  const [mode, setMode] = useThemeMode()

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition',
        open ? 'pointer-events-auto bg-black/60 backdrop-blur-sm' : 'pointer-events-none bg-transparent',
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-md translate-x-full bg-surface-contrast shadow-card transition-transform dark:bg-dark-surface',
          open ? 'translate-x-0' : '',
        )}
      >
        <header className="flex items-center justify-between border-b border-borderSoft px-5 py-4 dark:border-dark-border">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary dark:text-dark-subtitle">Painel</p>
            <h3 className="text-lg font-semibold text-textPrimary dark:text-dark-text">Configurações</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-textSecondary transition hover:bg-surface-muted dark:text-dark-subtitle dark:hover:bg-dark-surface2"
            aria-label="Fechar painel de configurações"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto p-5 text-sm">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-red-primary dark:text-dark-red-primary" />
              <p className="text-sm font-semibold text-textPrimary dark:text-dark-text">Aparência</p>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-borderSoft bg-surface-muted/50 p-3 dark:border-dark-border dark:bg-dark-surface2">
              <div className="flex-1">
                <p className="font-semibold text-textPrimary dark:text-dark-text">Tema</p>
                <p className="text-xs text-textSecondary dark:text-dark-subtitle">Altere entre claro e escuro.</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={cn(
                  'rounded-md border p-3 text-left transition',
                  mode === 'light'
                    ? 'border-red-primary bg-red-primary/10 text-red-primary'
                    : 'border-borderSoft hover:border-borderStrong dark:border-dark-border dark:hover:border-borderSoft',
                )}
              >
                <p className="font-semibold">Light</p>
                <p className="text-xs text-textSecondary">Tema ESPN clássico</p>
              </button>
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={cn(
                  'rounded-md border p-3 text-left transition',
                  mode === 'dark'
                    ? 'border-red-primary bg-red-primary/10 text-red-primary dark:bg-dark-surface2'
                    : 'border-borderSoft hover:border-borderStrong dark:border-dark-border dark:hover:border-borderSoft',
                )}
              >
                <p className="font-semibold">Dark</p>
                <p className="text-xs text-textSecondary">Vermelho suavizado</p>
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-red-primary dark:text-dark-red-primary" />
              <p className="text-sm font-semibold text-textPrimary dark:text-dark-text">Layout</p>
            </div>
            <Tabs
              options={[
                { value: 'comfortable', label: 'Confortável' },
                { value: 'compact', label: 'Compacto' },
              ]}
              value="comfortable"
              onChange={(value) => setDensity?.(value as 'comfortable' | 'compact')}
            />
            <p className="text-xs text-textSecondary dark:text-dark-subtitle">Controle de densidade para tabelas e listas.</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-primary dark:text-dark-red-primary" />
              <p className="text-sm font-semibold text-textPrimary dark:text-dark-text">Alertas</p>
            </div>
            <div className="space-y-2 rounded-md border border-borderSoft bg-surface-muted/50 p-3 dark:border-dark-border dark:bg-dark-surface2">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Sincronização de partidas</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-red-primary dark:accent-dark-red-primary" />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Súmulas pendentes</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-red-primary dark:accent-dark-red-primary" />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Atualizações do sistema</span>
                <input type="checkbox" className="h-4 w-4 accent-red-primary dark:accent-dark-red-primary" />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-primary dark:text-dark-red-primary" />
              <p className="text-sm font-semibold text-textPrimary dark:text-dark-text">Preferências rápidas</p>
            </div>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start text-left">Recarregar dados do dashboard</Button>
              <Button variant="outline" className="justify-start text-left">Resetar filtros</Button>
              <Button variant="outline" className="justify-start text-left">Ver logs do sistema</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
