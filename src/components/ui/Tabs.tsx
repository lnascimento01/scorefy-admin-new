'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TabOption {
  label: string
  value: string
  icon?: ReactNode
}

interface TabsProps {
  options: TabOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ options, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-xl border border-borderSoft bg-surface-contrast p-1 text-sm dark:border-dark-border dark:bg-dark-surface', className)}>
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition',
              isActive
                ? 'bg-red-primary text-white shadow-sm dark:bg-dark-red-primary'
                : 'text-textSecondary hover:bg-surface-muted dark:text-dark-subtitle dark:hover:bg-dark-surface2',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
