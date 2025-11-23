'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface PageWrapperProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  compact?: boolean
  className?: string
}

export function PageWrapper({ title, description, actions, children, compact = false, className }: PageWrapperProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('page-section', compact && 'page-section--compact', className)}
    >
      {(title || description || actions) && (
        <div className="page-section__header">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-textPrimary dark:text-dark-text">{title}</h2>
            {description && <p className="max-w-prose text-sm leading-relaxed text-textSecondary dark:text-dark-subtitle">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2 text-sm text-textSecondary dark:text-dark-subtitle">{actions}</div>}
        </div>
      )}
      {children}
    </motion.section>
  )
}
