'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { SidebarItem } from '@/components/ui/SidebarItem'

interface SidebarProps {
  items: { label: string; href: string; Icon: LucideIcon }[]
  activePath?: string | null
  footer?: ReactNode
  onClose?: () => void
}

export function Sidebar({ items, activePath, footer, onClose }: SidebarProps) {
  return (
    <aside className="sidebar-panel flex h-full w-72 flex-col gap-6 px-4 py-6 text-textPrimary">
      <div className="border-b border-borderSofter px-2.5 pb-5 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-textMuted">SCOREFY</p>
            <div className="space-y-1.5">
              <p className="text-[1.38rem] font-semibold leading-none tracking-[-0.025em] text-textPrimary">Admin</p>
              <p className="text-[0.8rem] leading-none text-textSecondary">Painel operacional</p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              className="rounded-full p-2 text-textSecondary transition hover:bg-surface-elevated hover:text-textPrimary focus-visible:outline-none focus-visible:shadow-focus lg:hidden"
              onClick={onClose}
              aria-label="Fechar menu lateral"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-1" aria-label="Navegação principal">
        {items.map((item) => (
          <SidebarItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.Icon}
            active={item.href === '/' ? activePath === '/' : activePath?.startsWith(item.href)}
            onClick={onClose}
          />
        ))}
      </nav>

      {footer && (
        <div className="mt-auto border-t border-borderSofter px-1 pt-4">
          <div className="rounded-lg bg-[color:color-mix(in_srgb,var(--surface-elevated)_74%,transparent)] px-3.5 py-3 text-sm text-textMuted [&_p:first-child]:text-[0.72rem] [&_p:first-child]:font-semibold [&_p:first-child]:uppercase [&_p:first-child]:tracking-[0.18em] [&_p:first-child]:text-textSecondary [&_p:last-child]:mt-1 [&_p:last-child]:text-xs [&_p:last-child]:leading-relaxed [&_p:last-child]:text-textMuted">
            {footer}
          </div>
        </div>
      )}
    </aside>
  )
}
