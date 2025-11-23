'use client'

import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-red-primary text-white hover:bg-red-hover shadow-sm',
  secondary: 'bg-gray-100 text-black hover:bg-gray-300/80 dark:bg-dark-surface dark:text-dark-text dark:hover:bg-dark-surface2',
  outline:
    'border border-borderSoft bg-transparent text-textPrimary hover:bg-surface-muted dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-surface2',
  ghost: 'text-textSecondary hover:text-textPrimary hover:bg-surface-muted'
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm'
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
}
