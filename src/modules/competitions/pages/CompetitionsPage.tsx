'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, Pencil, Plus, RefreshCcw, Trophy, Trash2 } from 'lucide-react'
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
import { useCompetitions } from '../hooks/useCompetitions'
import { useCompetitionCatalogs } from '../hooks/useCompetitionCatalogs'
import type { CompetitionStatus } from '../types'
import { ConfirmModal } from '@/components/ConfirmModal'
import { CompetitionsGateway } from '../services/competitions.service'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'

const statusLabel: Record<CompetitionStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  archived: 'Arquivada',
}

const statusVariant: Record<CompetitionStatus, 'warning' | 'success' | 'info'> = {
  draft: 'warning',
  published: 'success',
  archived: 'info',
}

function formatDateTime(value?: string) {
  if (!value) return 'Sem registro'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLatestSeason(value?: { name: string; season: string } | null) {
  if (!value) return '—'
  return `${value.name} • ${value.season}`
}

export function CompetitionsPage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const {
    competitions,
    meta,
    loading,
    error,
    source,
    filters,
    setSearch,
    setScope,
    setTypeId,
    setCountryId,
    setNaipe,
    setCategory,
    setSort,
    setPage,
    setPerPage,
    refetch,
  } = useCompetitions()
  const {
    competitionTypes,
    countries,
    loading: loadingCatalogs,
    error: catalogError,
  } = useCompetitionCatalogs()

  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const perPageOptions = [10, 20, 50, 100]

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
      <PageWrapper
        title="Competições"
        description="Lista de competições fixas. Temporadas são gerenciadas dentro da competição."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2" onClick={refetch} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Sincronizando...' : 'Atualizar'}
            </Button>
            <Button className="flex items-center gap-2" onClick={() => router.push('/competitions/create')}>
              <Plus className="h-4 w-4" />
              Nova competição
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {error && <AlertBanner variant="warning" message={error} />}
          {catalogError && <AlertBanner variant="warning" message={catalogError} />}
          {feedback && <AlertBanner variant={feedback.type === 'success' ? 'success' : 'error'} message={feedback.message} />}
          <AlertBanner
            variant="info"
            message={`Fonte: ${source === 'api' ? 'API /api/v1/auth/competitions' : 'API'}. A entidade principal é fixa; temporadas são selecionadas no detalhe.`}
          />
        </div>

        <section className="card mt-6 space-y-6 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
            <Filter className="h-4 w-4" />
            Filtros
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Buscar</span>
              <Input
                placeholder="Nome da competição"
                value={filters.q}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Escopo</span>
              <Select value={filters.scope} onChange={(event) => setScope(event.target.value as typeof filters.scope)}>
                <option value="all">Todos</option>
                <option value="national">Nacional</option>
                <option value="state">Estadual</option>
                <option value="international">Internacional</option>
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Naipe</span>
              <Select value={filters.naipe} onChange={(event) => setNaipe(event.target.value as typeof filters.naipe)}>
                <option value="all">Todos</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="misto">Misto</option>
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Tipo</span>
              <Select
                value={filters.typeId}
                onChange={(event) => setTypeId(event.target.value)}
                disabled={loadingCatalogs}
              >
                <option value="">Todos</option>
                {competitionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">País</span>
              <Select
                value={filters.countryId}
                onChange={(event) => setCountryId(event.target.value)}
                disabled={loadingCatalogs}
              >
                <option value="">Todos</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Categoria</span>
              <Input
                placeholder="Adulto, Sub-18..."
                value={filters.category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Ordenação</span>
              <Select value={filters.sort} onChange={(event) => setSort(event.target.value as typeof filters.sort)}>
                <option value="name">Nome (A-Z)</option>
                <option value="-name">Nome (Z-A)</option>
                <option value="created_at">Criada primeiro</option>
                <option value="-created_at">Criada por último</option>
              </Select>
            </label>
          </div>

          <div className="rounded-2xl border border-borderSoft">
            <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {`Exibindo ${competitions.length} de ${meta.total || competitions.length} competições`}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">
                {source === 'api' ? 'Backend' : 'API'}
              </span>
            </div>

            <div className="p-4">
              {loading && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Carregando competições...</p>
                </div>
              )}

              {!loading && competitions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Nenhuma competição encontrada</p>
                  <p className="text-sm text-textSecondary">Ajuste os filtros ou crie uma nova competição.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>País / Escopo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Temporadas</TableHead>
                      <TableHead>Última temporada</TableHead>
                      <TableHead>Atualização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitions.map((competition) => (
                      <TableRow key={competition.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-textPrimary">{competition.name}</p>
                            <p className="text-xs text-textSecondary">{competition.locale}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{competition.typeName ?? '—'}</p>
                          <p className="text-xs text-textSecondary">{competition.category ?? '—'}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{competition.country?.name ?? '—'}</p>
                          <p className="text-xs text-textSecondary">{competition.scope}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[competition.status]}>{statusLabel[competition.status]}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-textPrimary">{competition.seasonsCount ?? '—'}</p>
                          <p className="text-xs text-textSecondary">{competition.naipe ?? '—'}</p>
                        </TableCell>
                        <TableCell className="text-sm text-textSecondary">
                          {formatLatestSeason(competition.latestSeason ?? null)}
                        </TableCell>
                        <TableCell className="text-sm text-textSecondary">{formatDateTime(competition.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex items-center gap-1"
                              onClick={() => router.push(`/competitions/${competition.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                              Gerenciar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-secondary"
                              onClick={() => setConfirmId(competition.id)}
                              disabled={removing && confirmId === competition.id}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              {removing && confirmId === competition.id ? 'Removendo...' : 'Excluir'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <PaginationControls
            meta={meta}
            itemLabel="competições"
            isLoading={loading}
            perPageOptions={perPageOptions}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        </section>
      </PageWrapper>

      <ConfirmModal
        open={Boolean(confirmId)}
        title="Confirmar exclusão"
        description="A competição será removida. Deseja continuar?"
        confirmLabel="Excluir competição"
        onCancel={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          setRemoving(true)
          setFeedback(null)
          try {
            await CompetitionsGateway.remove(confirmId)
            setFeedback({ type: 'success', message: 'Competição removida com sucesso.' })
            await refetch()
          } catch (err) {
            setFeedback({ type: 'error', message: resolveMatchActionError(err, 'Não foi possível remover a competição.') })
          } finally {
            setRemoving(false)
            setConfirmId(null)
          }
        }}
      />
    </DashboardShell>
  )
}
