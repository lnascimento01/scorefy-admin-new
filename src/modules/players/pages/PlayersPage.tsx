'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Eye, Filter, Pencil, Plus, RefreshCcw, Trash2, UserRound, Users2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PaginationControls } from '@/components/PaginationControls'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { cn } from '@/lib/utils/cn'
import type { AuthProfile } from '@/services/auth.service'
import { usePlayerCatalogs } from '../hooks/usePlayerCatalogs'
import { usePlayers } from '../hooks/usePlayers'
import { PlayersGateway } from '../services/players.service'
import type { PlayerSummary } from '../types'
import { PlayerTransferModal } from '../components/PlayerTransferModal'

function formatDate(value?: string) {
  if (!value) return 'Sem registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'HS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function HeroStatCard({
  label,
  value,
  helper,
  accentClassName,
}: {
  label: string
  value: string
  helper: string
  accentClassName: string
}) {
  return (
    <div className="rounded-2xl border border-borderSofter bg-[rgba(255,255,255,0.04)] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-textSecondary">{label}</p>
        <span className={cn('h-2.5 w-2.5 rounded-full', accentClassName)} aria-hidden="true" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold leading-none text-textPrimary">{value}</p>
        <p className="max-w-36 text-right text-xs leading-relaxed text-textSecondary">{helper}</p>
      </div>
    </div>
  )
}

function PlayerAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(79,140,255,0.18)] bg-[rgba(79,140,255,0.12)] text-sm font-semibold text-primary">
      {getInitials(name)}
    </div>
  )
}

export function PlayersPage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const { players, meta, filters, loading, error, source, setSearch, setStatus, setTeamId, setPage, setPerPage, refetch } = usePlayers()
  const { teams, error: catalogError } = usePlayerCatalogs()
  const [transferPlayer, setTransferPlayer] = useState<PlayerSummary | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PlayerSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const activePlayers = players.filter((player) => player.isActive).length
  const inactivePlayers = players.length - activePlayers
  const totalPlayers = meta.total || players.length

  async function handleTransfer(teamId: string) {
    if (!transferPlayer || !teamId) return
    setSubmitting(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      await PlayersGateway.transfer(transferPlayer.id, { teamId })
      setActionSuccess(`Transferência concluída para ${transferPlayer.fullName}.`)
      setTransferPlayer(null)
      await refetch()
    } catch (error) {
      setActionError(resolveMatchActionError(error, 'Não foi possível transferir o atleta.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setSubmitting(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      await PlayersGateway.remove(confirmDelete.id)
      setActionSuccess(`Atleta ${confirmDelete.fullName} removido com sucesso.`)
      setConfirmDelete(null)
      await refetch()
    } catch (error) {
      setActionError(resolveMatchActionError(error, 'Não foi possível remover o atleta.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
      <div className="dark">
        <PageWrapper>
          <section className="relative overflow-hidden rounded-[32px] border border-borderSofter bg-[radial-gradient(circle_at_top_right,rgba(79,140,255,0.22),transparent_28%),linear-gradient(180deg,rgba(15,22,36,0.98),rgba(11,17,26,0.94))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_35%)]" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(79,140,255,0.24)] bg-[rgba(79,140,255,0.12)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  <Users2 className="h-3.5 w-3.5" />
                  HandScores / Jogadores
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-textPrimary sm:text-4xl">
                    Jogadores
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-textSecondary sm:text-base">
                    Gerencie atletas, vínculos, status e informações esportivas cadastradas no HandScores.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(87,181,255,0.18)] bg-[rgba(87,181,255,0.10)] px-3 py-1.5 text-xs font-semibold text-info">
                    <span className="h-2 w-2 rounded-full bg-info" />
                    {source === 'api' ? 'API ao vivo' : 'Fonte alternativa'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(226,232,240,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-semibold text-textSecondary">
                    <span className={cn('h-2 w-2 rounded-full', loading ? 'bg-warning' : 'bg-success')} />
                    {loading ? 'Sincronizando' : `Página ${meta.currentPage} de ${meta.lastPage}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={refetch} disabled={loading}>
                  <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
                  {loading ? 'Atualizando...' : 'Atualizar'}
                </Button>
                <Button className="gap-2 shadow-[0_18px_40px_rgba(79,140,255,0.24)]" onClick={() => router.push('/players/create')}>
                  <Plus className="h-4 w-4" />
                  Novo jogador
                </Button>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 md:grid-cols-3">
              <HeroStatCard
                label="Cadastrados"
                value={String(totalPlayers)}
                helper="Jogadores no total para a consulta atual."
                accentClassName="bg-primary"
              />
              <HeroStatCard
                label="Ativos"
                value={String(activePlayers)}
                helper="Atletas com status liberado para uso."
                accentClassName="bg-success"
              />
              <HeroStatCard
                label="Inativos"
                value={String(inactivePlayers)}
                helper="Registros pausados ou desativados no cadastro."
                accentClassName="bg-danger"
              />
            </div>
          </section>

          <div className="space-y-2">
            {(error || actionError) && <AlertBanner variant="error" message={actionError ?? error ?? undefined} />}
            {actionSuccess && <AlertBanner variant="success" message={actionSuccess} />}
            {catalogError && <AlertBanner variant="warning" message={catalogError} />}
            <AlertBanner variant="info" message={`Fonte de dados: ${source === 'api' ? 'API /api/v1/auth/players' : 'API'}.`} />
          </div>

          <section className="card space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-borderSofter pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-textSecondary">
                  <Filter className="h-4 w-4" />
                  Filtros
                </div>
                <p className="max-w-2xl text-sm text-textSecondary">
                  Refine a lista sem alterar os parâmetros enviados à API.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-borderSofter bg-[rgba(255,255,255,0.04)] px-3 py-1.5 font-semibold text-textSecondary">
                  {players.length} visíveis
                </span>
                <span className="rounded-full border border-[rgba(43,228,167,0.18)] bg-[rgba(43,228,167,0.10)] px-3 py-1.5 font-semibold text-success">
                  {activePlayers} ativos
                </span>
                <span className="rounded-full border border-[rgba(255,91,110,0.18)] bg-[rgba(255,91,110,0.10)] px-3 py-1.5 font-semibold text-danger">
                  {inactivePlayers} inativos
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Buscar</span>
                <Input
                  placeholder="Nome ou apelido"
                  value={filters.q}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Equipe</span>
                <Select value={filters.teamId} onChange={(event) => setTeamId(event.target.value)}>
                  <option value="all">Todas</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.secondaryLabel ? `${team.label} • ${team.secondaryLabel}` : team.label}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Status</span>
                <Select value={filters.status} onChange={(event) => setStatus(event.target.value as typeof filters.status)}>
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </Select>
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-borderSofter bg-[color:color-mix(in_srgb,var(--surface-contrast)_94%,transparent)] shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-borderSofter px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {`Exibindo ${players.length} de ${totalPlayers} jogadores`}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">HandScores API</span>
            </div>

            <div className="p-4">
              {loading && (
                <div className="rounded-2xl border border-dashed border-borderSofter bg-[rgba(255,255,255,0.02)] p-8 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(79,140,255,0.18)] bg-[rgba(79,140,255,0.10)] text-primary">
                    <RefreshCcw className="h-5 w-5 animate-spin" />
                  </div>
                  <p className="text-base font-semibold text-textPrimary">Carregando jogadores...</p>
                  <p className="mt-1 text-sm text-textSecondary">Buscando a lista atual na API.</p>
                </div>
              )}

              {!loading && players.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-borderSofter bg-[rgba(255,255,255,0.02)] p-8 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(79,140,255,0.18)] bg-[rgba(79,140,255,0.10)] text-primary">
                    <Users2 className="h-5 w-5" />
                  </div>
                  <p className="text-base font-semibold text-textPrimary">Nenhum jogador encontrado</p>
                  <p className="mt-1 text-sm text-textSecondary">Ajuste os filtros ou cadastre um novo jogador.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jogador</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Posição</TableHead>
                      <TableHead>Camisa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <PlayerAvatar name={player.fullName} />
                            <div className="min-w-0">
                              <p className="font-semibold text-textPrimary">{player.fullName}</p>
                              <p className="truncate text-xs uppercase tracking-wide text-textSecondary">
                                {player.nickname ?? 'Sem apelido'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-textPrimary">{player.team?.name ?? 'Sem equipe base'}</p>
                          <p className="text-xs text-textSecondary">{player.team?.shortName ?? '—'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{player.position?.name ?? '—'}</p>
                          <p className="text-xs text-textSecondary">{player.position?.code ?? ''}</p>
                        </TableCell>
                        <TableCell className="text-textPrimary">{player.number ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={player.isActive ? 'success' : 'danger'} className="w-fit">
                            {player.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(player.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 px-0"
                              onClick={() => router.push(`/players/${player.id}`)}
                              aria-label={`Ver jogador ${player.fullName}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 w-9 px-0"
                              onClick={() => router.push(`/players/${player.id}/edit`)}
                              aria-label={`Editar jogador ${player.fullName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 px-0"
                              onClick={() => setTransferPlayer(player)}
                              aria-label={`Transferir jogador ${player.fullName}`}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 px-0 text-danger hover:text-danger"
                              onClick={() => setConfirmDelete(player)}
                              aria-label={`Excluir jogador ${player.fullName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="px-4 pb-4">
              <PaginationControls
                meta={meta}
                itemLabel="jogadores"
                isLoading={loading}
                perPageOptions={[10, 20, 50]}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
              />
            </div>
          </section>
        </PageWrapper>

        <PlayerTransferModal
          key={transferPlayer?.id ?? 'player-transfer'}
          open={Boolean(transferPlayer)}
          player={transferPlayer}
          teams={teams}
          submitting={submitting}
          error={actionError}
          onCancel={() => {
            if (!submitting) {
              setTransferPlayer(null)
              setActionError(null)
            }
          }}
          onConfirm={(teamId) => {
            handleTransfer(teamId).catch(() => undefined)
          }}
        />

        <ConfirmModal
          open={Boolean(confirmDelete)}
          title="Confirmar exclusão"
          description={confirmDelete ? `O atleta "${confirmDelete.fullName}" será removido se não houver histórico vinculado.` : undefined}
          confirmLabel={submitting ? 'Excluindo...' : 'Excluir atleta'}
          onCancel={() => {
            if (!submitting) {
              setConfirmDelete(null)
              setActionError(null)
            }
          }}
          onConfirm={() => {
            handleDelete().catch(() => undefined)
          }}
        />
      </div>
    </DashboardShell>
  )
}
