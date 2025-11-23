'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ChartContainerProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartContainer({ title, description, actions, children, className }: ChartContainerProps) {
  return (
    <section className={cn('card flex flex-col gap-3', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-textPrimary dark:text-dark-text">{title}</h3>
          {description && <p className="text-sm text-textSecondary dark:text-dark-subtitle">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="h-[280px] w-full">{children}</div>
    </section>
  )
}
