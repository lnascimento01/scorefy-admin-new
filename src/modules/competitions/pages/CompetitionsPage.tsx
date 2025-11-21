'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { AuthProfile } from '@/services/auth.service'
import { useCompetitions } from '../hooks/useCompetitions'
import type { CompetitionSummary } from '../types'
import { ConfirmModal } from '@/components/ConfirmModal'
import { CompetitionsGateway } from '../services/competitions.service'

function getSeasonLabel(season: Competition['season']) {
  if (!season) return '—'
  return season
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return 'Sem registro'
  }
  try {
    const date = new Date(value)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (_error) {
    return value
  }
}

export function CompetitionsPage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CompetitionSummary['status']>('all')
  const { competitions, loading, error, source, refetch } = useCompetitions()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  const filteredCompetitions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return competitions.filter((competition) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? competition.status === 'active'
            : competition.status === 'deleted'
      if (!matchesStatus) return false
      if (!term) return true
      const haystack = [
        competition.name,
        competition.season ?? '',
        competition.type ?? '',
        competition.country ?? '',
        competition.scope ?? '',
        competition.naipe ?? '',
        competition.category ?? ''
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [competitions, searchTerm, statusFilter])

  const deletedCompetitions = filteredCompetitions.filter((competition) => competition.status === 'deleted')

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
      <PageWrapper
        title="Competições"
        description="Crie, edite e remova competições sincronizadas com o Scorefy."
        actions={
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => refetch()}
                disabled={loading}
              >
                <RefreshCcw className="h-4 w-4" />
                {loading ? 'Sincronizando...' : 'Atualizar'}
              </Button>
              <Button onClick={() => alert('Fluxo de criação em breve')} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova competição
              </Button>
            </div>
            <span className="text-xs font-mono text-textSecondary sm:ml-4">
              Fonte: {source === 'api' ? 'API /v1/auth/competitions' : 'mock'}
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <AlertBanner variant="error" message={error} />}
          {feedback && <AlertBanner variant="success" message={feedback} />}
          {deletedCompetitions.length > 0 && (
            <AlertBanner variant="info" message={`${deletedCompetitions.length} competições estão marcadas como removidas.`} />
          )}
        </div>

        <section className="card mt-6 space-y-6 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="Buscar por nome, temporada ou país"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="deleted">Removidas</option>
              </Select>
              <div className="flex items-center justify-end text-sm text-textSecondary md:justify-start">
                Última sincronização: dataset local
              </div>
            </div>
          </div>

          {deletedCompetitions.length > 0 && statusFilter !== 'deleted' && (
            <AlertBanner
              variant="info"
              message={`${deletedCompetitions.length} competições estão na lixeira (soft delete). Filtre por "Removidas" para visualizá-las.`}
            />
          )}

          <div className="rounded-2xl border border-borderSoft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Temporada</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Categoria / Escopo</TableHead>
                  <TableHead>Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompetitions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-textSecondary">
                      Nenhuma competição encontrada com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
                {filteredCompetitions.map((competition) => {
                  const isDeleted = competition.status === 'deleted'
                  const metaString = competition.meta ? JSON.stringify(competition.meta) : ''
                  const metaSummary = metaString
                    ? metaString.length > 80
                      ? `${metaString.slice(0, 80)}…`
                      : metaString
                    : null
                  return (
                    <TableRow key={competition.id} className={isDeleted ? 'opacity-70' : undefined}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-textPrimary">{competition.name}</span>
                          {metaSummary && <span className="text-xs text-textSecondary/80">meta: {metaSummary}</span>}
                        </div>
                      </TableCell>
                      <TableCell>{getSeasonLabel(competition.season)}</TableCell>
                      <TableCell>{competition.type ?? '—'}</TableCell>
                      <TableCell>{competition.country ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={isDeleted ? 'danger' : 'success'}>
                          {isDeleted ? 'Removida' : 'Ativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{competition.category ?? '—'}</span>
                          <span className="text-xs text-textSecondary">{competition.scope ?? '—'}</span>
                          {competition.naipe && (
                            <span className="text-[10px] uppercase tracking-wide text-textSecondary/70">
                              {competition.naipe}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-textSecondary">{formatUpdatedAt(competition.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-1"
                            onClick={() => router.push(`/competitions/${competition.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-primary"
                            onClick={() => setConfirmId(competition.id)}
                            disabled={removing && confirmId === competition.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            {removing && confirmId === competition.id ? 'Removendo...' : 'Remover'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      <ConfirmModal
        open={Boolean(confirmId)}
        title="Confirmar remoção"
        description="Esta ação removerá a competição. Deseja continuar?"
        onCancel={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          setRemoving(true)
          try {
            await CompetitionsGateway.remove(confirmId)
            setFeedback('Competição removida.')
            refetch()
          } catch {
            setFeedback('Não foi possível remover a competição.')
          } finally {
            setRemoving(false)
            setConfirmId(null)
          }
        }}
      />
      </PageWrapper>
    </DashboardShell>
  )
}
