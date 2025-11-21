'use client'

import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] px-3 py-2 text-sm text-textPrimary focus:border-secondary focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
