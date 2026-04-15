'use client'

import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'border border-transparent bg-primary text-onPrimary hover:bg-[var(--color-primary-hover)] shadow-card',
  secondary: 'border border-borderSoft bg-surface-elevated text-textPrimary hover:bg-surface-raised',
  outline: 'border border-borderSofter bg-transparent text-textSecondary hover:bg-surface-elevated hover:text-textPrimary',
  ghost: 'border border-transparent bg-transparent text-textSecondary hover:bg-[rgba(255,255,255,0.06)] hover:text-textPrimary',
  danger: 'border border-[rgba(255,91,110,0.25)] bg-[rgba(255,91,110,0.16)] text-danger hover:bg-[rgba(255,91,110,0.22)]'
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
        'inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
}
