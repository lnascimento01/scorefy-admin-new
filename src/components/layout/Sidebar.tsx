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
    <aside className="flex h-full w-72 flex-col gap-8 bg-surface px-6 py-6 text-textPrimary dark:bg-dark-surface">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-textSecondary dark:text-dark-textSecondary">SCOREFY</p>
          <p className="text-2xl font-semibold text-textPrimary dark:text-dark-text">Admin</p>
        </div>
        {onClose && (
          <button
            type="button"
            className="rounded-full p-2 text-textSecondary transition hover:bg-card hover:text-textPrimary dark:text-dark-textSecondary dark:hover:bg-dark-surface2 lg:hidden"
            onClick={onClose}
            aria-label="Fechar menu lateral"
          >
            ×
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-2" aria-label="Navegação principal">
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

      {footer && <div className="mt-auto space-y-2 rounded-apple border border-borderSoft bg-card p-4 text-sm text-textSecondary shadow-card dark:border-dark-border dark:bg-dark-surface2 dark:text-dark-textSecondary">{footer}</div>}
    </aside>
  )
}
