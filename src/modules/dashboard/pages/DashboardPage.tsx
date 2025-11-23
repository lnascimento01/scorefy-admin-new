'use client'

import type { AuthProfile } from '@/services/auth.service'
import { useDashboardData } from '../hooks/useDashboardData'
import { DashboardShell } from '../components/DashboardShell'
import { FullScreenMessage } from '../components/FullScreenMessage'
import { useI18n } from '@/lib/i18n'
import { CardKPI } from '@/components/CardKPI'
import { ChartBar } from '@/components/charts/ChartBar'
import { ChartLine } from '@/components/charts/ChartLine'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ChartContainer } from '@/components/ui/ChartContainer'
import { Radio, TrendingUp, Trophy, Users } from 'lucide-react'
import type { MatchStatus } from '../types'

const statusVariant: Record<MatchStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  scheduled: 'info',
  not_started: 'info',
  live: 'danger',
  paused: 'warning',
  halftime: 'warning',
  final: 'success',
  finished: 'success',
  canceled: 'danger'
}

const statusLabel: Record<MatchStatus, string> = {
  scheduled: 'Agendada',
  not_started: 'Não iniciada',
  live: 'Ao vivo',
  paused: 'Pausada',
  halftime: 'Intervalo',
  final: 'Finalizada',
  finished: 'Finalizada',
  canceled: 'Cancelada'
}

interface DashboardPageProps {
  currentUser: AuthProfile
}

export function DashboardPage({ currentUser }: DashboardPageProps) {
  const { snapshot, alerts, isLoading, isRefreshing, refetch } = useDashboardData()
  const { dictionary, language } = useI18n()
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR'

  const formatNumber = (value: number | null, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat(locale, options).format(value)
  }

  if (!snapshot || isLoading) {
    return <FullScreenMessage title={dictionary.dashboard.loading} />
  }

  const overview = snapshot.overview
  const cards = [
    {
      title: dictionary.dashboard.metrics.liveMatches.title,
      value: formatNumber(overview.liveMatches, { maximumFractionDigits: 0 }),
      change: dictionary.dashboard.metrics.liveMatches.helper,
      description: dictionary.dashboard.metrics.liveMatches.description,
      icon: Radio,
      trend: 'up' as const
    },
    {
      title: dictionary.dashboard.metrics.activeUsers.title,
      value: formatNumber(overview.activeUsers, { maximumFractionDigits: 0 }),
      change: dictionary.dashboard.metrics.activeUsers.helper,
      description: dictionary.dashboard.metrics.activeUsers.description,
      icon: Users,
      trend: 'up' as const
    },
    {
      title: dictionary.dashboard.metrics.averageGoals.title,
      value: formatNumber(overview.averageGoals, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      change: dictionary.dashboard.metrics.averageGoals.helper,
      description: dictionary.dashboard.metrics.averageGoals.description,
      icon: Trophy,
      trend: 'neutral' as const
    },
    {
      title: dictionary.dashboard.metrics.victoryRate.title,
      value: `${formatNumber(overview.victoryRate, { maximumFractionDigits: 0 })}%`,
      change: dictionary.dashboard.metrics.victoryRate.helper,
      description: dictionary.dashboard.metrics.victoryRate.description,
      icon: TrendingUp,
      trend: overview.victoryRate !== null && overview.victoryRate < 50 ? 'down' : 'up'
    }
  ]

  return (
    <DashboardShell
      userName={currentUser.name}
      userEmail={currentUser.email}
      onRefresh={refetch}
      refreshing={isRefreshing}
    >
      <PageWrapper title={dictionary.dashboard.title} description={dictionary.dashboard.description}>
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertBanner key={alert} variant="warning" message={dictionary.dashboard.alerts[alert]} />
            ))}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <CardKPI
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              description={card.description}
              icon={card.icon}
              trend={card.trend}
            />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartContainer
            title={dictionary.dashboard.charts.teamPerformance.title}
            description={dictionary.dashboard.charts.teamPerformance.description}
          >
            <ChartBar data={snapshot.teamPerformance} dataKey="goals" nameKey="team" color="#D22128" />
          </ChartContainer>
          <ChartContainer
            title={dictionary.dashboard.charts.weeklyPerformance.title}
            description={dictionary.dashboard.charts.weeklyPerformance.description}
          >
            <ChartLine
              data={snapshot.weeklyPerformance}
              xKey="label"
              lines={[
                { dataKey: 'goals', color: '#D22128', name: dictionary.dashboard.charts.labels.goalsFor },
                { dataKey: 'conceded', color: '#1D4ED8', name: dictionary.dashboard.charts.labels.goalsAgainst }
              ]}
            />
          </ChartContainer>
        </section>

        <section className="card flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-textPrimary dark:text-dark-text">{dictionary.dashboard.matches.title}</h3>
              <p className="text-sm text-textSecondary dark:text-dark-subtitle">{dictionary.dashboard.matches.description}</p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dictionary.dashboard.matches.table.date}</TableHead>
                <TableHead>{dictionary.dashboard.matches.table.teams}</TableHead>
                <TableHead>{dictionary.dashboard.matches.table.score}</TableHead>
                <TableHead>{dictionary.dashboard.matches.table.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.latestMatches.length ? (
                snapshot.latestMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-textPrimary">{match.date}</p>
                        <p className="text-xs text-textSecondary">{match.time}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold text-textPrimary">
                          {match.homeTeam} {match.homeShort && <span className="text-xs uppercase text-textSecondary">({match.homeShort})</span>}
                        </p>
                        <p className="font-semibold text-textPrimary">
                          {match.awayTeam} {match.awayShort && <span className="text-xs uppercase text-textSecondary">({match.awayShort})</span>}
                        </p>
                        <p className="text-xs text-textSecondary">
                          {match.competition} {match.venue ? `• ${match.venue}` : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-textPrimary">{match.score}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={statusVariant[match.status]}>{dictionary.dashboard.status[match.status] ?? statusLabel[match.status]}</Badge>
                        {match.metaSlug && (
                          <span className="text-[10px] uppercase tracking-wide text-textSecondary/70">{match.metaSlug}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-textSecondary">
                    {dictionary.dashboard.matches.empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      </PageWrapper>
    </DashboardShell>
  )
}
