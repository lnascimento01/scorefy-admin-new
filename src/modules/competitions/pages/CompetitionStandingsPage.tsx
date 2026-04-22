'use client'

import { ArrowLeft, Filter, Layers3, RefreshCcw, Trophy, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AuthProfile } from '@/services/auth.service'
import { AlertBanner } from '@/components/AlertBanner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { useCompetitionStandings } from '../hooks/useCompetitionStandings'
import type { CompetitionNaipe, CompetitionSeasonListItem, CompetitionStandingRow, CompetitionStandingsScope } from '../types'

function formatSeasonLabel(season: CompetitionSeasonListItem) {
  const primary = season.label || season.name || season.season || season.id
  const secondary = season.season && season.season !== primary ? season.season : null
  return secondary ? `${primary} • ${secondary}` : primary
}

function formatWinPercentage(value: number) {
  const percent = value <= 1 ? value * 100 : value
  return `${percent.toFixed(1)}%`
}

function formatGoalDiff(value: number) {
  if (value > 0) return `+${value}`
  return String(value)
}

function scopeLabel(scope: CompetitionStandingsScope, row?: CompetitionStandingRow | null, stageName?: string | null, groupName?: string | null) {
  if (scope === 'group') {
    if (groupName) return `Grupo ${groupName}`
    return row?.group?.name ? `Grupo ${row.group.name}` : 'Grupo'
  }
  if (scope === 'stage') {
    if (stageName) return `Fase ${stageName}`
    return row?.stage?.name ? `Fase ${row.stage.name}` : 'Fase'
  }
  return 'Classificação geral'
}

function naipeLabel(naipe: CompetitionNaipe) {
  switch (naipe) {
    case 'masculino':
      return 'Masculino'
    case 'feminino':
      return 'Feminino'
    default:
      return 'Misto'
  }
}

export function CompetitionStandingsPage({ currentUser, competitionId }: { currentUser: AuthProfile; competitionId: string }) {
  const router = useRouter()
  const standings = useCompetitionStandings(competitionId)

  const currentRow = standings.standings[0] ?? null
  const selectedStageName = standings.stages.find((stage) => stage.id === standings.selectedStageId)?.name ?? null
  const selectedGroupName = standings.groups.find((group) => group.id === standings.selectedGroupId)?.name ?? null
  const currentScopeLabel = scopeLabel(standings.scope, currentRow, selectedStageName, selectedGroupName)

  return (
    <DashboardShell
      userName={currentUser.name}
      userEmail={currentUser.email}
      onRefresh={standings.refetch}
      refreshing={standings.loading || standings.loadingStandings || standings.loadingFilters}
    >
      <PageWrapper
        title={`Classificação${standings.competition ? ` • ${standings.competition.name}` : ''}`}
        description="Consumo direto de standings por temporada. A tela abre na temporada mais recente e só envia fase, grupo e naipe quando o escopo exigir."
        actions={(
          <>
            <Button variant="outline" size="sm" onClick={() => router.push('/competitions')}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={standings.refetch}
              disabled={standings.loading || standings.loadingStandings || standings.loadingFilters}
            >
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          {standings.error && <AlertBanner variant="error" message={standings.error} />}
          {standings.selectionMessage && <AlertBanner variant="warning" message={standings.selectionMessage} />}
          <AlertBanner
            variant="info"
            message="Tabela geral consulta apenas `competition_season_id` e, quando necessário, `naipe`. Fase e grupo só entram na query quando você seleciona esses escopos."
          />
        </div>

        <section className="card mt-6 space-y-6 p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-borderSoft bg-surface-contrast p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
                <Trophy className="h-4 w-4" />
                Contexto ativo
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Competição</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">{standings.competition?.name ?? 'Carregando...'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Temporada</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">
                    {standings.selectedSeason ? formatSeasonLabel(standings.selectedSeason) : 'Selecione uma temporada'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Escopo</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">{currentScopeLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Naipe</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">
                    {standings.selectedNaipe ? naipeLabel(standings.selectedNaipe) : (standings.availableNaipes[0] ? naipeLabel(standings.availableNaipes[0]) : '—')}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-borderSoft bg-surface-contrast p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
                <Users className="h-4 w-4" />
                Resultado
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Linhas retornadas</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">{standings.meta.total || standings.standings.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Última atualização</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">{currentRow?.updatedAt ? new Date(currentRow.updatedAt).toLocaleString('pt-BR') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Fases disponíveis</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">{standings.stages.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Grupos disponíveis</p>
                  <p className="mt-1 text-sm font-semibold text-textPrimary">{standings.groups.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
              <Filter className="h-4 w-4" />
              Filtros
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Temporada</span>
                <Select
                  value={standings.selectedSeasonId ?? ''}
                  onChange={(event) => standings.selectSeason(event.target.value || null)}
                  disabled={standings.loading || standings.seasons.length === 0}
                >
                  <option value="">Selecione a temporada</option>
                  {standings.seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {formatSeasonLabel(season)}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Escopo</span>
                <Select
                  value={standings.scope}
                  onChange={(event) => standings.setScope(event.target.value as CompetitionStandingsScope)}
                  disabled={!standings.selectedSeasonId}
                >
                  <option value="global">Classificação geral</option>
                  <option value="stage">Fase</option>
                  <option value="group">Grupo</option>
                </Select>
              </label>

              {standings.availableNaipes.length > 1 && (
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Naipe</span>
                  <Select
                    value={standings.selectedNaipe ?? ''}
                    onChange={(event) => standings.selectNaipe((event.target.value || null) as CompetitionNaipe | null)}
                    disabled={!standings.selectedSeasonId}
                  >
                    <option value="">Selecione o naipe</option>
                    {standings.availableNaipes.map((naipe) => (
                      <option key={naipe} value={naipe}>
                        {naipeLabel(naipe)}
                      </option>
                    ))}
                  </Select>
                </label>
              )}

              {(standings.scope === 'stage' || standings.scope === 'group') && (
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Fase</span>
                  <Select
                    value={standings.selectedStageId ?? ''}
                    onChange={(event) => standings.selectStage(event.target.value || null)}
                    disabled={!standings.selectedSeasonId || standings.stages.length === 0}
                  >
                    <option value="">Selecione a fase</option>
                    {standings.stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </Select>
                </label>
              )}

              {standings.scope === 'group' && (
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Grupo</span>
                  <Select
                    value={standings.selectedGroupId ?? ''}
                    onChange={(event) => standings.selectGroup(event.target.value || null)}
                    disabled={!standings.selectedSeasonId || standings.filteredGroups.length === 0}
                  >
                    <option value="">Selecione o grupo</option>
                    {standings.filteredGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.stage?.name ? `${group.stage.name} • ${group.name}` : group.name}
                      </option>
                    ))}
                  </Select>
                </label>
              )}
            </div>

            {standings.selectedSeason && !standings.requiresNaipeSelection && standings.availableNaipes.length === 1 && (
              <AlertBanner
                variant="info"
                message={`Temporada de naipe único. A tela resolveu automaticamente ${naipeLabel(standings.availableNaipes[0])}.`}
              />
            )}

            {standings.scope === 'stage' && standings.stages.length === 0 && (
              <AlertBanner variant="info" message="Nenhuma fase disponível para a temporada e naipe selecionados." />
            )}

            {standings.scope === 'group' && standings.filteredGroups.length === 0 && (
              <AlertBanner variant="info" message="Nenhum grupo disponível para os filtros atuais." />
            )}
          </div>

          <div className="rounded-2xl border border-borderSoft">
            <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                <span>{currentScopeLabel}</span>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">/standings</span>
            </div>

            <div className="p-4">
              {standings.loading && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Carregando contexto da classificação...</p>
                </div>
              )}

              {!standings.loading && !standings.selectedSeasonId && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Nenhuma temporada disponível</p>
                  <p className="text-sm text-textSecondary">Crie uma temporada para consultar standings desta competição.</p>
                </div>
              )}

              {!standings.loading && standings.selectedSeasonId && !standings.canLoadStandings && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Selecione os filtros obrigatórios</p>
                  <p className="text-sm text-textSecondary">
                    {standings.selectionMessage ?? 'Defina temporada, naipe e escopo para carregar a classificação.'}
                  </p>
                </div>
              )}

              {!standings.loading && standings.canLoadStandings && standings.loadingStandings && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Atualizando classificação...</p>
                </div>
              )}

              {!standings.loading && standings.canLoadStandings && !standings.loadingStandings && standings.standings.length === 0 && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Nenhuma linha encontrada</p>
                  <p className="text-sm text-textSecondary">Os filtros atuais não retornaram classificação para esse recorte.</p>
                </div>
              )}

              {!standings.loading && standings.canLoadStandings && !standings.loadingStandings && standings.standings.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pos</TableHead>
                      <TableHead>Clube</TableHead>
                      <TableHead>PTS</TableHead>
                      <TableHead>J</TableHead>
                      <TableHead>V</TableHead>
                      <TableHead>E</TableHead>
                      <TableHead>D</TableHead>
                      <TableHead>GP</TableHead>
                      <TableHead>GC</TableHead>
                      <TableHead>SG</TableHead>
                      <TableHead>Aproveitamento</TableHead>
                      <TableHead>Forma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.standings.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-semibold">{row.rank ?? index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-textPrimary">{row.team?.shortName ?? row.team?.name ?? `Equipe ${row.teamId}`}</p>
                            <p className="text-xs text-textSecondary">{row.team?.shortName ? row.team.name : currentScopeLabel}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{row.points}</TableCell>
                        <TableCell>{row.played}</TableCell>
                        <TableCell>{row.wins}</TableCell>
                        <TableCell>{row.draws}</TableCell>
                        <TableCell>{row.losses}</TableCell>
                        <TableCell>{row.goalsFor}</TableCell>
                        <TableCell>{row.goalsAgainst}</TableCell>
                        <TableCell>{formatGoalDiff(row.goalDiff)}</TableCell>
                        <TableCell>{formatWinPercentage(row.winPercentage)}</TableCell>
                        <TableCell className="uppercase tracking-wide">{row.form.join(' ') || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </section>
      </PageWrapper>
    </DashboardShell>
  )
}
