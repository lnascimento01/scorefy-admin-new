'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function PageContainer({ children, className, fullWidth = true }: PageContainerProps) {
  return (
    <div className={cn('page-container', fullWidth ? 'w-full max-w-none' : 'max-w-6xl', className)}>
      {children}
    </div>
  )
}
