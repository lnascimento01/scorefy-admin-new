'use client'

import type { LucideIcon } from 'lucide-react'
import { CardMetric } from './ui/CardMetric'

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
  return (
    <CardMetric
      title={title}
      value={value}
      change={change}
      trend={trend}
      icon={Icon as LucideIcon}
      description={description}
      className={className}
    />
  )
}
