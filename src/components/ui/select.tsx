'use client'

import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'field-control pr-9',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
