'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  helper: string
  description?: string
  value: string
  Icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricCard({ title, helper, description, value, Icon, trend = 'neutral' }: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
        ? 'text-rose-400'
        : 'text-textSecondary'

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-textSecondary">{title}</p>
          <p className="mt-2 text-4xl font-semibold text-textPrimary">{value}</p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-secondary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`text-sm font-semibold ${trendColor}`}>{helper}</p>
      {description && <p className="text-sm text-textSecondary">{description}</p>}
    </div>
  )
}
