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
    <aside className="sidebar-panel flex h-full w-64 flex-col border-r border-borderSoft/70 bg-surface-contrast px-4 py-6 text-textPrimary dark:border-dark-border dark:bg-dark-surface">
      <div className="flex items-center justify-between px-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-textSecondary dark:text-dark-subtitle">SCOREFY</p>
          <p className="text-lg font-semibold text-textPrimary dark:text-dark-text">Admin</p>
        </div>
        {onClose && (
          <button
            type="button"
            className="rounded-md p-2 text-textSecondary transition hover:bg-surface-muted dark:text-dark-subtitle dark:hover:bg-dark-surface2 lg:hidden"
            onClick={onClose}
            aria-label="Fechar menu lateral"
          >
            ×
          </button>
        )}
      </div>

      <nav className="mt-6 space-y-1" aria-label="Navegação principal">
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

      {footer && <div className="mt-auto px-2 pt-6 text-xs text-textSecondary dark:text-dark-subtitle">{footer}</div>}
    </aside>
  )
}
