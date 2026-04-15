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
  variant?: 'default' | 'workspace'
}

export function Tabs({ options, value, onChange, className, variant = 'default' }: TabsProps) {
  const isWorkspace = variant === 'workspace'

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm',
        isWorkspace
          ? 'w-full rounded-2xl border border-borderSoft bg-surface-elevated p-1.5 shadow-card'
          : 'rounded-xl border border-borderSofter bg-surface-contrast p-1',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex items-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:shadow-focus',
              isWorkspace ? 'flex-1 justify-center px-4 py-3 text-sm' : 'px-3 py-1.5',
              isActive
                ? isWorkspace
                  ? 'bg-surface-contrast text-textPrimary shadow-card after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-primary'
                  : 'bg-[var(--brand-soft)] text-textPrimary after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary'
                : isWorkspace
                  ? 'text-textSecondary hover:bg-surface-raised hover:text-textPrimary'
                  : 'text-textMuted hover:bg-surface-elevated hover:text-textPrimary',
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
