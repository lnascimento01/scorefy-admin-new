'use client'

import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-md border border-borderSoft bg-surface-elevated px-3 text-sm text-textPrimary placeholder:text-textPlaceholder shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text',
        className,
      )}
      {...props}
    />
  )
}
