'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Eye, Filter, Pencil, RefreshCcw, Trash2, UserRound, Users2 } from 'lucide-react'
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

export function PlayersPage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const { players, meta, filters, loading, error, source, setSearch, setStatus, setTeamId, setPage, setPerPage, refetch } = usePlayers()
  const { teams, error: catalogError } = usePlayerCatalogs()
  const [transferPlayer, setTransferPlayer] = useState<PlayerSummary | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PlayerSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

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
      <PageWrapper
        title="Gestão de atletas"
        description="Cadastre, consulte e transfira atletas entre equipes sem quebrar o domínio de inscrições sazonais."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={refetch} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Sincronizando...' : 'Atualizar'}
            </Button>
            <Button className="gap-2" onClick={() => router.push('/players/create')}>
              <Users2 className="h-4 w-4" />
              Novo atleta
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {(error || actionError) && <AlertBanner variant="warning" message={actionError ?? error ?? undefined} />}
          {actionSuccess && <AlertBanner variant="success" message={actionSuccess} />}
          {catalogError && <AlertBanner variant="warning" message={catalogError} />}
          <AlertBanner variant="info" message={`Fonte: ${source === 'api' ? 'API /api/v1/auth/players' : 'API'}.`} />
        </div>

        <section className="card space-y-6 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
            <Filter className="h-4 w-4" />
            Filtros
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

          <div className="rounded-2xl border border-borderSoft">
            <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {`Exibindo ${players.length} de ${meta.total || players.length} atletas`}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">Backend</span>
            </div>

            <div className="p-4">
              {loading && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Carregando atletas...</p>
                </div>
              )}

              {!loading && players.length === 0 ? (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Nenhum atleta encontrado</p>
                  <p className="text-sm text-textSecondary">Ajuste os filtros ou cadastre um novo atleta.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atleta</TableHead>
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
                          <div>
                            <p className="font-semibold text-textPrimary">{player.fullName}</p>
                            <p className="text-xs uppercase tracking-wide text-textSecondary">{player.nickname ?? 'Sem apelido'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{player.team?.name ?? 'Sem equipe base'}</p>
                          <p className="text-xs text-textSecondary">{player.team?.shortName ?? ''}</p>
                        </TableCell>
                        <TableCell>{player.position?.name ?? '—'}</TableCell>
                        <TableCell>{player.number ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={player.isActive ? 'success' : 'danger'}>
                            {player.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(player.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => router.push(`/players/${player.id}`)}>
                              <Eye className="mr-1 h-4 w-4" />
                              Ver
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => router.push(`/players/${player.id}/edit`)}>
                              <Pencil className="mr-1 h-4 w-4" />
                              Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setTransferPlayer(player)}>
                              <ArrowRightLeft className="mr-1 h-4 w-4" />
                              Transferir
                            </Button>
                            <Button size="sm" variant="ghost" className="text-secondary" onClick={() => setConfirmDelete(player)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              Excluir
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
                itemLabel="atletas"
                isLoading={loading}
                perPageOptions={[10, 20, 50]}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
              />
            </div>
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
    </DashboardShell>
  )
}
