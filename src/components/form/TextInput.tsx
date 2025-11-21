'use client'

import { InputHTMLAttributes } from 'react'

export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-borderSoft bg-surface px-3 py-2 text-sm text-textPrimary placeholder-textPlaceholder transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
      {...props}
    />
  )
}
