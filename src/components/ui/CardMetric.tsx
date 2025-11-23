'use client'

import type { LucideIcon } from 'lucide-react'
import { createElement, isValidElement } from 'react'
import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type MetricTrend = 'up' | 'down' | 'neutral'

interface CardMetricProps {
  title: string
  value: string | number
  description?: string
  change?: string
  trend?: MetricTrend
  icon?: LucideIcon | ElementType | ReactNode
  className?: string
}

export function CardMetric({ title, value, description, change, trend = 'neutral', icon, className }: CardMetricProps) {
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-red-primary dark:text-dark-red-primary'
        : 'text-textSecondary'
  const IconComponent = icon && !isValidElement(icon) ? (icon as ElementType) : null
  const iconNode = icon
    ? IconComponent
      ? createElement(IconComponent, { className: 'h-5 w-5' })
      : icon
    : null

  return (
    <div className={cn('rounded-xl border border-borderSoft bg-surface-contrast p-4 shadow-card dark:border-dark-border dark:bg-dark-surface', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-dark-subtitle">{title}</span>
          <p className="text-3xl font-semibold leading-tight text-textPrimary dark:text-dark-text">{value}</p>
          {change && <p className={cn('text-sm font-semibold', trendColor)}>{change}</p>}
        </div>
        {iconNode && (
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-primary/10 text-red-primary dark:bg-dark-red-primary/15 dark:text-dark-red-primary">
            {iconNode}
          </span>
        )}
      </div>
      {description && <p className="pt-2 text-sm text-textSecondary dark:text-dark-subtitle">{description}</p>}
    </div>
  )
}
