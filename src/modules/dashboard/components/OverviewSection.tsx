'use client'

import { Radio, TrendingUp, Trophy, Users } from 'lucide-react'
import { MetricCard } from './MetricCard'
import { DashboardOverview } from '../types'
import { useI18n } from '@/lib/i18n'

interface OverviewSectionProps {
  overview: DashboardOverview
}

export function OverviewSection({ overview }: OverviewSectionProps) {
  const { dictionary, language } = useI18n()
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR'
  const formatNumber = (value: number | null, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat(locale, options).format(value)
  }
  const victoryTrend = overview.victoryRate !== null && overview.victoryRate < 50 ? 'down' : 'up'
  const cards = [
    {
      title: dictionary.dashboard.metrics.liveMatches.title,
      helper: dictionary.dashboard.metrics.liveMatches.helper,
      description: dictionary.dashboard.metrics.liveMatches.description,
      value: formatNumber(overview.liveMatches, { maximumFractionDigits: 0 }),
      Icon: Radio,
      trend: 'up' as const
    },
    {
      title: dictionary.dashboard.metrics.activeUsers.title,
      helper: dictionary.dashboard.metrics.activeUsers.helper,
      description: dictionary.dashboard.metrics.activeUsers.description,
      value: formatNumber(overview.activeUsers, { maximumFractionDigits: 0 }),
      Icon: Users,
      trend: 'up' as const
    },
    {
      title: dictionary.dashboard.metrics.averageGoals.title,
      helper: dictionary.dashboard.metrics.averageGoals.helper,
      description: dictionary.dashboard.metrics.averageGoals.description,
      value: formatNumber(overview.averageGoals, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      Icon: Trophy,
      trend: 'neutral' as const
    },
    {
      title: dictionary.dashboard.metrics.victoryRate.title,
      helper: dictionary.dashboard.metrics.victoryRate.helper,
      description: dictionary.dashboard.metrics.victoryRate.description,
      value: `${formatNumber(overview.victoryRate, { maximumFractionDigits: 0 })}%`,
      Icon: TrendingUp,
      trend: victoryTrend
    }
  ]

  return (
    <section className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(16rem,100%),1fr))]">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          title={card.title}
          helper={card.helper}
          description={card.description}
          value={card.value}
          Icon={card.Icon}
          trend={card.trend}
        />
      ))}
    </section>
  )
}
