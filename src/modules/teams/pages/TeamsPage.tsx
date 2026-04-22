'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Layers3, RefreshCcw, Trash2, Users2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PaginationControls } from '@/components/PaginationControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import type { AuthProfile } from '@/services/auth.service'
import { useTeamCatalogs } from '../hooks/useTeamCatalogs'
import { useTeams } from '../hooks/useTeams'
import { TeamsGateway } from '../services/teams.service'

function formatDateLabel(value?: string | null) {
  if (!value) return 'Sem registro'
  try {
    return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return value
  }
}

export function TeamsPage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const { teams, meta, loading, error, filters, setCountryId, setPage, setPerPage, setSearch, setSort, refetch } = useTeams()
  const { countries, loading: loadingCatalogs, error: catalogError, refetch: refetchCatalogs } = useTeamCatalogs()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const perPageOptions = [10, 20, 50]

  const teamToRemove = teams.find((team) => team.id === confirmId) ?? null

  async function handleRemove() {
    if (!confirmId) return
    setRemoving(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      await TeamsGateway.remove(confirmId)
      setActionSuccess('Equipe removida com sucesso.')
      refetch()
    } catch (error) {
      setActionError(resolveMatchActionError(error, 'Não foi possível remover a equipe.'))
    } finally {
      setRemoving(false)
      setConfirmId(null)
    }
  }

  return (
    <DashboardShell
      userName={currentUser.name}
      userEmail={currentUser.email}
      onRefresh={() => {
        refetch()
        refetchCatalogs()
      }}
      refreshing={loading || loadingCatalogs}
    >
      <PageWrapper
        title="Gestão de equipes"
        description="Mantenha o cadastro-base das equipes usando o contrato real do backend."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={refetch} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Sincronizando...' : 'Atualizar lista'}
            </Button>
            <Button className="flex items-center gap-2" onClick={() => router.push('/teams/create')}>
              <Users2 className="h-4 w-4" />
              Nova equipe
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {(error || actionError) && <AlertBanner variant="warning" message={actionError ?? error ?? undefined} />}
          {actionSuccess && <AlertBanner variant="success" message={actionSuccess} />}
          {catalogError && <AlertBanner variant="warning" message={catalogError} />}
          <AlertBanner variant="info" message="Fonte: API /api/v1/auth/teams." />
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
                placeholder="Nome, abreviação ou slug"
                value={filters.search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">País</span>
              <Select value={filters.countryId} onChange={(event) => setCountryId(event.target.value)}>
                <option value="">Todos</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Ordenação</span>
              <Select value={filters.sort} onChange={(event) => setSort(event.target.value as typeof filters.sort)}>
                <option value="name">Nome A-Z</option>
                <option value="-name">Nome Z-A</option>
                <option value="-created_at">Mais recentes</option>
                <option value="created_at">Mais antigas</option>
              </Select>
            </label>
          </div>

          <div className="rounded-2xl border border-borderSoft">
            <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                {`Exibindo ${teams.length} de ${meta.total || teams.length} equipes`}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">Backend</span>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Carregando equipes...</p>
                </div>
              ) : teams.length === 0 ? (
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
                      <TableHead>Slug</TableHead>
                      <TableHead>Cores</TableHead>
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
                            <p className="text-xs uppercase tracking-wide text-textSecondary">{team.shortName ?? 'Sem abreviação'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{team.city ?? 'Cidade não informada'}</p>
                          <p className="text-xs text-textSecondary">{team.country?.name ?? 'País não informado'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{team.slug ?? '—'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2 md:justify-start">
                            {team.colors.length ? (
                              team.colors.map((color) => (
                                <Badge key={`${team.id}-${color}`} variant="info">
                                  {color}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-textSecondary">Sem cores</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{formatDateLabel(team.updatedAt)}</p>
                          <p className="text-xs text-textSecondary">{`Criada em ${formatDateLabel(team.createdAt)}`}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="secondary" className="mr-2" onClick={() => router.push(`/teams/${team.id}/edit`)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-secondary" onClick={() => setConfirmId(team.id)}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            Excluir
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
        title="Confirmar exclusão"
        description={
          teamToRemove
            ? `A equipe "${teamToRemove.name}" só será removida se não houver vínculos ativos com atletas, partidas, grupos, inscrições sazonais, comissão ou notícias.`
            : 'A equipe só será removida se não houver vínculos ativos.'
        }
        confirmLabel={removing ? 'Excluindo...' : 'Excluir equipe'}
        onCancel={() => {
          if (!removing) {
            setConfirmId(null)
          }
        }}
        onConfirm={handleRemove}
      />
    </DashboardShell>
  )
}
