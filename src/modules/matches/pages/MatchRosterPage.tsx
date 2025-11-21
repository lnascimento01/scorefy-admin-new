'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2, RefreshCcw, RotateCcw, Users, Users2 } from 'lucide-react'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMatchRosterEditor } from '../hooks/useMatchRosterEditor'
import type { MatchControlParticipant } from '@/modules/match-control/types'
import type { MatchStatus } from '../types'

function formatDateLabel(timestamp?: string | null) {
  if (!timestamp) return '—'
  try {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
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

function ParticipantRow({
  participant,
  selectedForRemoval,
  onToggle
}: {
  participant: MatchControlParticipant
  selectedForRemoval: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-borderSoft/60 bg-surface-muted px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-textPrimary">{participant.name}</p>
        <p className="text-[10px] uppercase tracking-wide text-textSecondary">
          {participant.position ?? participant.role ?? 'Jogador'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {typeof participant.shirtNumber === 'number' && (
          <span className="text-xs font-semibold text-textSecondary">#{participant.shirtNumber}</span>
        )}
        <Button
          type="button"
          variant={selectedForRemoval ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onToggle(participant.id)}
          className="gap-2"
        >
          {selectedForRemoval ? <RotateCcw className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          {selectedForRemoval ? 'Recolocar' : 'Remover'}
        </Button>
      </div>
    </div>
  )
}

function RosterBlock({
  title,
  participants,
  removedIds,
  onToggle
}: {
  title: string
  participants: MatchControlParticipant[]
  removedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const players = participants.filter((p) => !p.isStaff)
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-textPrimary">{title}</p>
          <p className="text-xs text-textSecondary">Jogadores escalados para esta partida.</p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-textSecondary">
          {players.length} atletas
        </span>
      </div>
      <div className="space-y-2">
        {players.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            selectedForRemoval={removedIds.has(participant.id)}
            onToggle={onToggle}
          />
        ))}
        {!players.length && (
          <div className="rounded-xl border border-dashed border-borderSoft p-4 text-sm text-textSecondary">
            Nenhum atleta disponível.
          </div>
        )}
      </div>
    </div>
  )
}

export function MatchRosterPage({ currentUser, matchId }: { currentUser: AuthProfile; matchId: string }) {
  const router = useRouter()
  const {
    detail,
    loading,
    saving,
    error,
    success,
    removedIds,
    addIds,
    addInput,
    toggleRemoval,
    addCandidate,
    removeFromAdds,
    setAddInput,
    refresh,
    submitChanges
  } = useMatchRosterEditor(matchId)

  const startLabel = formatDateLabel(detail?.startAt)

  const removalCount = removedIds.size
  const addCount = addIds.length

  const hasChanges = removalCount > 0 || addCount > 0

  const subtitle = useMemo(() => {
    if (!detail) return 'Carregando partida...'
    return `${detail.homeTeam.name} x ${detail.awayTeam.name} • ${startLabel}`
  }, [detail, startLabel])

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Editar elenco" description="Carregando dados da partida...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando elenco da partida...</span>
          </div>
        </PageWrapper>
      </DashboardShell>
    )
  }

  const matchMeta = [
    { label: 'Competição', value: detail.competitionName ?? '—' },
    { label: 'Local', value: detail.venueName ?? 'Local indefinido' },
    { label: 'Início previsto', value: startLabel },
    { label: 'Status', value: statusLabel[detail.status as MatchStatus] ?? detail.status }
  ]

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refresh}>
      <PageWrapper
        title="Editar elenco"
        description={subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/matches/${matchId}/control`)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao painel
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/matches/${matchId}/edit`)}>
              Editar dados
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/matches')}>
              <RefreshCcw className="h-4 w-4" />
              Ir para listagem
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {(error || success) && (
              <AlertBanner variant={error ? 'error' : 'success'} message={error ?? undefined} title={success ?? undefined} />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <RosterBlock
                title={`Mandante • ${detail.homeTeam.name}`}
                participants={detail.participants.home}
                removedIds={removedIds}
                onToggle={toggleRemoval}
              />
              <RosterBlock
                title={`Visitante • ${detail.awayTeam.name}`}
                participants={detail.participants.away}
                removedIds={removedIds}
                onToggle={toggleRemoval}
              />
            </div>

            <div className="card space-y-4 p-5">
              <p className="text-sm font-semibold text-textPrimary">Jogadores para re-incluir / adicionar</p>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  placeholder="Informe IDs separados por vírgula ou um por vez"
                  value={addInput}
                  onChange={(event) => setAddInput(event.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    if (!addInput.trim()) return
                    addInput
                      .split(',')
                      .map((part) => part.trim())
                      .filter(Boolean)
                      .forEach((id) => addCandidate(id))
                  }}
                  disabled={saving}
                >
                  <Check className="h-4 w-4" />
                  Adicionar à mudança
                </Button>
              </div>
              {addIds.length > 0 ? (
                <div className="rounded-xl border border-borderSoft/70 bg-surface-muted p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">IDs a serem adicionados</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {addIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-semibold text-secondary"
                    >
                      {id}
                      <button type="button" onClick={() => removeFromAdds(id)} aria-label={`Remover ${id}`}>
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              ) : (
                <p className="text-sm text-textSecondary">Nenhum jogador extra selecionado.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card space-y-2 p-5">
              <p className="text-sm font-semibold text-textPrimary">Dados da partida</p>
              <ul className="space-y-2 text-sm text-textSecondary">
                {matchMeta.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase tracking-wide">{item.label}</span>
                    <span className="font-semibold text-textPrimary">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card space-y-3 p-5">
              <p className="text-sm font-semibold text-textPrimary">Resumo das alterações</p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• Remoções: {removalCount}</li>
                <li>• Inclusões: {addCount}</li>
                <li>• É enviado PATCH /matches/{matchId}/players com arrays atomizados.</li>
              </ul>
              <p className="text-xs text-textSecondary">
                O backend valida mínimo de atletas e conflitos de time, retornando 422 com mensagem detalhada.
              </p>
              <Button
                type="button"
                className="mt-2 w-full gap-2"
                onClick={() => submitChanges().catch(() => undefined)}
                disabled={!hasChanges || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users2 className="h-4 w-4" />}
                {saving ? 'Salvando mudanças...' : 'Aplicar mudanças'}
              </Button>
              {!hasChanges && <p className="text-xs text-textSecondary">Selecione quem remover ou IDs para adicionar.</p>}
            </div>
            <div className="card space-y-2 p-5 text-sm text-textSecondary">
              <p className="text-sm font-semibold text-textPrimary">Dicas</p>
              <ul className="space-y-2">
                <li>• Atletas marcados como Recolocar permanecem no elenco até enviar o PATCH.</li>
                <li>• Para reverter, clique em Recolocar antes de salvar.</li>
                <li>• IDs adicionados devem pertencer ao mandante ou visitante.</li>
              </ul>
            </div>
          </div>
        </div>
      </PageWrapper>
    </DashboardShell>
  )
}
