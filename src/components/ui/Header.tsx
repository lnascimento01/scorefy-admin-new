'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function Header({ title, subtitle, actions, className }: HeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary dark:text-dark-text">{title}</h1>
        {subtitle && <p className="text-sm text-textSecondary dark:text-dark-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
