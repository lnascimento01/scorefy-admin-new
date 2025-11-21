'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageWrapperProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  compact?: boolean
}

export function PageWrapper({ title, description, actions, children, compact = false }: PageWrapperProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`page-section${compact ? ' page-section--compact' : ''}`}
    >
      <div className="page-section__header">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-textPrimary">{title}</h2>
          {description && <p className="max-w-prose text-sm leading-relaxed text-textSecondary md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 text-sm text-textSecondary">{actions}</div>}
      </div>
      {children}
    </motion.section>
  )
}
