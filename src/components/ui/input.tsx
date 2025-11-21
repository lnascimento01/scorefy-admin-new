'use client'

import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] px-3 py-2 text-sm text-textPrimary placeholder-textPlaceholder focus:border-secondary focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}
