'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Layers3, RefreshCcw, Trash2, Users2 } from 'lucide-react'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PaginationControls } from '@/components/PaginationControls'
import type { AuthProfile } from '@/services/auth.service'
import { useTeams } from '../hooks/useTeams'
import type { TeamStatus } from '../types'
import { ConfirmModal } from '@/components/ConfirmModal'
import { TeamsGateway } from '../services/teams.service'

const statusLabel: Record<TeamStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  draft: 'Em formação'
}

const statusVariant: Record<TeamStatus, 'success' | 'danger' | 'info'> = {
  active: 'success',
  inactive: 'danger',
  draft: 'info'
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Sem registro'
  try {
    return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (_error) {
    return value
  }
}

export function TeamsPage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const {
    teams,
    meta,
    loading,
    error,
    source,
    filters,
    setStatus,
    setCategory,
    setGender,
    setSearch,
    setPage,
    setPerPage,
    refetch
  } = useTeams()
  const perPageOptions = [10, 20, 50]
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const categories = useMemo(() => {
    const set = new Set<string>()
    teams.forEach((team) => {
      if (team.category) set.add(team.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [teams])

  const genders = useMemo(() => {
    const set = new Set<string>()
    teams.forEach((team) => {
      if (team.gender) set.add(team.gender)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [teams])

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
      <PageWrapper
        title="Gestão de equipes"
        description="Controle categorias, status e elencos cadastrados no Scorefy."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={refetch} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Sincronizando...' : 'Atualizar lista'}
            </Button>
            <Button className="flex items-center gap-2" onClick={() => alert('Fluxo de criação em breve')}>
              <Users2 className="h-4 w-4" />
              Nova equipe
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {error && <AlertBanner variant="warning" message={error} />}
          <AlertBanner variant="info" message={`Fonte: ${source === 'api' ? 'API' : 'mock'}.`} />
        </div>

        <section className="card space-y-6 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Buscar</span>
              <Input
                placeholder="Nome, cidade ou técnico"
                value={filters.search}
                onChange={(event) => {
                  setSearch(event.target.value)
                }}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Status</span>
              <Select
                value={filters.status}
                onChange={(event) => {
                  setStatus(event.target.value as TeamStatus | 'all')
                }}
              >
                <option value="all">Todos</option>
                <option value="active">Ativas</option>
                <option value="draft">Em formação</option>
                <option value="inactive">Inativas</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Categoria</span>
              <Select
                value={filters.category}
                onChange={(event) => {
                  setCategory(event.target.value)
                }}
              >
                <option value="all">Todas</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Gênero</span>
              <Select
                value={filters.gender}
                onChange={(event) => {
                  setGender(event.target.value)
                }}
              >
                <option value="all">Todos</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="rounded-2xl border border-borderSoft">
            <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                {`Exibindo ${teams.length} de ${meta.total || teams.length} equipes`}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">{source === 'api' ? 'Backend' : 'Dataset local'}</span>
            </div>
            <div className="p-4">
              {loading && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Carregando equipes...</p>
                </div>
              )}
              {!loading && teams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Nenhuma equipe encontrada</p>
                  <p className="text-sm text-textSecondary">Ajuste os filtros ou cadastre uma nova equipe.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atletas</TableHead>
                      <TableHead>Atualização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-textPrimary">{team.name}</p>
                            <p className="text-xs uppercase tracking-wide text-textSecondary">{team.shortName ?? '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">
                            {team.city ?? '—'}
                            {team.state ? ` • ${team.state}` : ''}
                          </p>
                          <p className="text-xs text-textSecondary">{team.country ?? ''}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{team.category ?? '—'}</p>
                          <p className="text-xs text-textSecondary">{team.gender ?? ''}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[team.status]}>{statusLabel[team.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-textPrimary">{team.totalPlayers ?? '—'} atletas</p>
                          <p className="text-xs text-textSecondary">{team.coach ? `Téc.: ${team.coach}` : 'Sem técnico'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{formatDateLabel(team.updatedAt)}</p>
                          <p className="text-xs text-textSecondary">
                            {team.foundedAt ? `Desde ${formatDateLabel(team.foundedAt)}` : 'Fundação não informada'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mr-2"
                            onClick={() => router.push(`/teams/${team.id}/edit`)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-secondary"
                            onClick={() => setConfirmId(team.id)}
                            disabled={removing && confirmId === team.id}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            {removing && confirmId === team.id ? 'Removendo...' : 'Remover'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <PaginationControls meta={meta} perPageOptions={perPageOptions} isLoading={loading} onPageChange={setPage} onPerPageChange={setPerPage} />
              </div>
            </div>
          </div>
        </section>
      </PageWrapper>
      <ConfirmModal
        open={Boolean(confirmId)}
        title="Confirmar remoção"
        description="Esta ação removerá a equipe. Deseja continuar?"
        onCancel={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          setRemoving(true)
          try {
            await TeamsGateway.remove(confirmId)
            refetch()
          } catch {
            // erro silencioso com fallback
          } finally {
            setRemoving(false)
            setConfirmId(null)
          }
        }}
      />
    </DashboardShell>
  )
}
