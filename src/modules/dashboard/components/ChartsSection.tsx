'use client'

import { TeamPerformanceDatum, WeeklyPerformanceDatum } from '../types'
import { useI18n } from '@/lib/i18n'

interface ChartsSectionProps {
  teamPerformance: TeamPerformanceDatum[]
  weeklyPerformance: WeeklyPerformanceDatum[]
}

export function ChartsSection({ teamPerformance, weeklyPerformance }: ChartsSectionProps) {
  const { dictionary } = useI18n()
  const maxGoals = Math.max(1, ...teamPerformance.map((item) => item.goals))

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="card">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-textPrimary">
            {dictionary.dashboard.charts.teamPerformance.title}
          </h3>
          <p className="text-sm text-textSecondary">
            {dictionary.dashboard.charts.teamPerformance.description}
          </p>
        </div>
        <div className="space-y-4">
          {teamPerformance.map((item) => {
            const goalsWidth = `${Math.round((item.goals / maxGoals) * 100)}%`
            const concededWidth = `${Math.round((item.conceded / maxGoals) * 100)}%`
            return (
              <div key={item.team}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-textPrimary">{item.team}</span>
                  <span className="text-textSecondary">
                    {item.goals} / {item.conceded}
                  </span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-surface-muted">
                  <div className="relative h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: goalsWidth }}>
                    <span
                      className="absolute inset-0 rounded-full bg-secondary/20"
                      style={{ width: concededWidth }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-textPrimary">
            {dictionary.dashboard.charts.weeklyPerformance.title}
          </h3>
          <p className="text-sm text-textSecondary">
            {dictionary.dashboard.charts.weeklyPerformance.description}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {weeklyPerformance.map((item) => (
            <div key={item.label} className="rounded-xl border border-borderSoft bg-[var(--surface-elevated-strong)] p-4">
              <p className="text-xs uppercase tracking-wide text-textSecondary">{item.label}</p>
              <div className="mt-2 space-y-1 text-sm text-textPrimary">
                <div className="flex items-center justify-between">
                  <span>{dictionary.dashboard.charts.labels.goalsFor}</span>
                  <span>{item.goals}</span>
                </div>
                <div className="flex items-center justify-between text-textSecondary">
                  <span>{dictionary.dashboard.charts.labels.goalsAgainst}</span>
                  <span>{item.conceded}</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 rounded-full bg-secondary/20">
                  <div
                    className="h-2 rounded-full bg-secondary"
                    style={{
                      width: `${Math.min(100, (item.goals / Math.max(item.goals + item.conceded, 1)) * 100)}%`
                    }}
                  />
                </div>
                <div className="h-2 rounded-full bg-primary/15">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (item.conceded / Math.max(item.goals + item.conceded, 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
