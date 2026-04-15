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
          'absolute right-0 top-0 h-full w-full max-w-md translate-x-full border-l border-borderSofter bg-surface-contrast shadow-popover transition-transform',
          open ? 'translate-x-0' : '',
        )}
      >
        <header className="flex items-center justify-between border-b border-borderSofter px-5 py-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">Painel</p>
            <h3 className="text-lg font-semibold text-textPrimary">Configurações</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-textSecondary transition hover:bg-surface-elevated"
            aria-label="Fechar painel de configurações"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto p-5 text-sm">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-textPrimary">Aparência</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-borderSofter bg-surface-elevated p-3">
              <div className="flex-1">
                <p className="font-semibold text-textPrimary">Tema</p>
                <p className="text-xs text-textSecondary">Altere entre claro e escuro.</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={cn(
                  'rounded-xl border p-3 text-left transition',
                  mode === 'light'
                    ? 'border-[color:var(--brand-soft-border)] bg-[var(--brand-soft)] text-primary'
                    : 'border-borderSofter text-textSecondary hover:bg-surface-elevated hover:text-textPrimary',
                )}
              >
                <p className="font-semibold">Light</p>
                <p className="text-xs text-textSecondary">Tema ESPN clássico</p>
              </button>
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={cn(
                  'rounded-xl border p-3 text-left transition',
                  mode === 'dark'
                    ? 'border-[color:var(--brand-soft-border)] bg-[var(--brand-soft)] text-primary'
                    : 'border-borderSofter text-textSecondary hover:bg-surface-elevated hover:text-textPrimary',
                )}
              >
                <p className="font-semibold">Dark</p>
                <p className="text-xs text-textSecondary">Admin Dark Clean</p>
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-textPrimary">Layout</p>
            </div>
            <Tabs
              options={[
                { value: 'comfortable', label: 'Confortável' },
                { value: 'compact', label: 'Compacto' },
              ]}
              value="comfortable"
              onChange={(value) => setDensity?.(value as 'comfortable' | 'compact')}
            />
            <p className="text-xs text-textSecondary">Controle de densidade para tabelas e listas.</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-textPrimary">Alertas</p>
            </div>
            <div className="space-y-2 rounded-xl border border-borderSofter bg-surface-elevated p-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Sincronização de partidas</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Súmulas pendentes</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Atualizações do sistema</span>
                <input type="checkbox" className="h-4 w-4 accent-primary" />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-textPrimary">Preferências rápidas</p>
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
