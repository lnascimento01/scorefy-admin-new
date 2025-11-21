'use client'

import { Activity, Gauge, ShieldCheck, Target } from 'lucide-react'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { CardKPI } from '@/components/CardKPI'
import { ChartBar } from '@/components/charts/ChartBar'
import { ChartLine } from '@/components/charts/ChartLine'
import type { AuthProfile } from '@/services/auth.service'
import { useStatsData } from '../hooks/useStatsData'

export function StatsPage({ currentUser }: { currentUser: AuthProfile }) {
  const { overview, topScoringTeams, goalsByRound, loading, error, source, refetch } = useStatsData()

  const totalGoals = topScoringTeams.reduce((acc, item) => acc + (item.goals ?? 0), 0)
  const averageConceded =
    goalsByRound.length === 0 ? 0 : goalsByRound.reduce((acc, item) => acc + (item.conceded ?? 0), 0) / goalsByRound.length

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch} refreshing={loading}>
      <PageWrapper
        title="Inteligência de desempenho"
        description="Insights consolidados de gols, eficiência e distribuição das partidas."
        actions={
          <span className="text-xs font-mono text-textSecondary">
            Fonte: /api/v1/auth/admin/dashboard/metrics ({source})
          </span>
        }
      >
        <div className="space-y-4">
          {error && <AlertBanner variant="warning" message={error} />}
          {!error && <AlertBanner variant="info" message="Sincronizando dados diretamente do endpoint de métricas." />}
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardKPI
            title="Partidas ao vivo"
            value={overview.liveMatches !== null ? String(overview.liveMatches) : '—'}
            change="Contagem atual"
            icon={Activity}
          />
          <CardKPI
            title="Usuários ativos (30d)"
            value={overview.activeUsers !== null ? String(overview.activeUsers) : '—'}
            change="Tokens válidos e usados"
            icon={Gauge}
          />
          <CardKPI
            title="Média de gols (mês)"
            value={overview.averageGoals !== null ? overview.averageGoals.toFixed(1) : '—'}
            change="(home_score + away_score) em partidas finalizadas"
            icon={ShieldCheck}
          />
          <CardKPI
            title="Vitórias mandante (últ. mês)"
            value={overview.victoryRate !== null ? `${overview.victoryRate.toFixed(1)}%` : '—'}
            change="Partidas finalizadas"
            icon={Target}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-textPrimary">Gols por equipe</h3>
            <p className="text-sm text-textSecondary">Top 10 equipes com mais gols no ano (dados do endpoint).</p>
            <ChartBar data={topScoringTeams} dataKey="goals" nameKey="team" color="#ef4444" />
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-textPrimary">Gols por semana (mandante)</h3>
            <p className="text-sm text-textSecondary">Séries de gols marcados e sofridos nas últimas semanas ISO.</p>
            <ChartLine
              data={goalsByRound}
              xKey="label"
              lines={[
                { dataKey: 'goals', color: '#10b981', name: 'Gols marcados' },
                { dataKey: 'conceded', color: '#ef4444', name: 'Gols sofridos' }
              ]}
            />
          </div>
        </section>

        <section className="card space-y-2 p-6">
          <p className="text-sm font-semibold text-textPrimary">Resumo rápido</p>
          <p className="text-sm text-textSecondary">
            Total de gols somados das equipes no ranking: <span className="font-semibold text-textPrimary">{totalGoals}</span>
          </p>
          <p className="text-sm text-textSecondary">
            Média defensiva (gols sofridos por semana agrupada):{' '}
            <span className="font-semibold text-textPrimary">{averageConceded.toFixed(1)}</span>
          </p>
        </section>
      </PageWrapper>
    </DashboardShell>
  )
}
