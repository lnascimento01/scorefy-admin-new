'use client'

import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface CardKPIProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  description?: string
  className?: string
}

export function CardKPI({ title, value, change, trend = 'neutral', icon: Icon, description, className }: CardKPIProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
        ? 'text-rose-400'
        : 'text-textSecondary'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'card relative flex flex-col gap-4 overflow-hidden border border-borderSoft bg-[var(--card-bg)] p-6 text-left shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-textSecondary/80">{title}</span>
          <p className="mt-2 text-4xl font-semibold text-textPrimary">{value}</p>
        </div>
        <span className="rounded-2xl border border-borderSoft bg-[var(--surface-muted)] p-3 text-textPrimary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      {change && <p className={cn('text-sm font-semibold', trendColor)}>{change}</p>}
      {description && <p className="text-sm text-textSecondary">{description}</p>}
    </motion.div>
  )
}
