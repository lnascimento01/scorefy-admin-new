'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus
} from 'lucide-react'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { MatchControlParticipant } from '@/modules/match-control/types'
import type { CompetitionSeasonTeamPlayerRegistration } from '@/modules/competitions/types'
import { useMatchRosterEditor } from '../hooks/useMatchRosterEditor'
import { formatMatchStatusLabel } from '../utils/status'

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

function normalizeSearch(text: string) {
  return text
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function matchesSearch(texts: Array<string | number | null | undefined>, query: string) {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return true

  const combined = texts
    .filter((value): value is string | number => value !== null && value !== undefined)
    .map((value) => String(value))
    .join(' ')

  return normalizeSearch(combined).includes(normalizedQuery)
}

function getEligibleLabel(player: CompetitionSeasonTeamPlayerRegistration) {
  const baseName = player.player?.fullName || player.player?.nickname || `Atleta #${player.playerId}`
  const parts = [baseName]
  if (player.shirtNumber !== undefined && player.shirtNumber !== null) {
    parts.push(`#${player.shirtNumber}`)
  }
  if (player.position) {
    parts.push(player.position)
  }
  return parts.join(' • ')
}

function getRelatedLabel(participant: MatchControlParticipant) {
  const parts = [participant.name]
  if (typeof participant.shirtNumber === 'number') {
    parts.push(`#${participant.shirtNumber}`)
  }
  if (participant.position) {
    parts.push(participant.position)
  } else if (participant.role) {
    parts.push(participant.role)
  }
  return parts.join(' • ')
}

function rosterSort(left: { shirtNumber?: number; name: string }, right: { shirtNumber?: number; name: string }) {
  const leftNumber = left.shirtNumber ?? Number.MAX_SAFE_INTEGER
  const rightNumber = right.shirtNumber ?? Number.MAX_SAFE_INTEGER

  if (leftNumber !== rightNumber) {
    return leftNumber - rightNumber
  }

  return left.name.localeCompare(right.name, 'pt-BR')
}

function SideRosterCard({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  eligiblePlayers,
  relatedPlayers,
  addIds,
  removeIds,
  onToggleAdd,
  onToggleRemove
}: {
  title: string
  subtitle: string
  searchValue: string
  onSearchChange: (value: string) => void
  eligiblePlayers: CompetitionSeasonTeamPlayerRegistration[]
  relatedPlayers: MatchControlParticipant[]
  addIds: string[]
  removeIds: string[]
  onToggleAdd: (id: string) => void
  onToggleRemove: (id: string) => void
}) {
  const relatedIdSet = new Set(relatedPlayers.map((participant) => participant.id))
  const addIdSet = new Set(addIds)
  const removeIdSet = new Set(removeIds)

  const visibleEligiblePlayers = eligiblePlayers
    .filter((player) => !relatedIdSet.has(player.playerId))
    .filter((player) =>
      matchesSearch(
        [
          player.player?.fullName,
          player.player?.nickname,
          player.player?.number !== undefined && player.player?.number !== null ? `#${player.player.number}` : null,
          player.position,
          player.player?.positionName
        ],
        searchValue
      )
    )

  const visibleRelatedPlayers = relatedPlayers.filter((participant) =>
    matchesSearch(
      [
        participant.name,
        participant.nick,
        participant.position,
        participant.role,
        participant.shirtNumber !== undefined ? `#${participant.shirtNumber}` : null
      ],
      searchValue
    )
  )

  const pendingAdds = eligiblePlayers.filter((player) => addIdSet.has(player.playerId))
  const pendingRemovals = relatedPlayers.filter((participant) => removeIdSet.has(participant.id))

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-textPrimary">{title}</p>
          <p className="text-sm text-textSecondary">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{visibleEligiblePlayers.length} elegíveis</Badge>
          <Badge variant="success">{visibleRelatedPlayers.length} relacionados</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl border border-borderSoft/70 bg-surface-muted px-3 py-2">
          <Search className="h-4 w-4 text-textSecondary" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Filtrar por nome, camisa ou posição"
            className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-borderSoft/70 bg-surface-muted p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-textPrimary">Elegíveis</p>
              <p className="text-xs text-textSecondary">Jogadores inscritos e aptos para esta partida.</p>
            </div>
            <Badge variant="info">{visibleEligiblePlayers.length}</Badge>
          </div>

          <div className="space-y-2">
            {visibleEligiblePlayers.map((player) => {
              const pending = addIdSet.has(player.playerId)
              return (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-xl border border-borderSoft/60 bg-[var(--surface-elevated-strong)] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-textPrimary">{getEligibleLabel(player)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-textSecondary">
                      {player.player?.isActive ? 'Ativo' : 'Inativo'} • {player.registrationStatus} • {player.eligibilityStatus}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={pending ? 'secondary' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => onToggleAdd(player.playerId)}
                  >
                    {pending ? <CheckCircle2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {pending ? 'A incluir' : 'Relacionar'}
                  </Button>
                </div>
              )
            })}

            {!visibleEligiblePlayers.length && (
              <div className="rounded-xl border border-dashed border-borderSoft p-4 text-sm text-textSecondary">
                Nenhum atleta elegível encontrado para este time.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-borderSoft/70 bg-surface-muted p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-textPrimary">Relacionados</p>
              <p className="text-xs text-textSecondary">Elenco já vinculado ao jogo e disponível para eventos.</p>
            </div>
            <Badge variant="success">{visibleRelatedPlayers.length}</Badge>
          </div>

          <div className="space-y-2">
            {visibleRelatedPlayers
              .slice()
              .sort((left, right) => rosterSort({ name: left.name, shirtNumber: left.shirtNumber }, { name: right.name, shirtNumber: right.shirtNumber }))
              .map((participant) => {
                const pending = removeIdSet.has(participant.id)
                return (
                  <div key={participant.id} className="flex items-center justify-between gap-3 rounded-xl border border-borderSoft/60 bg-[var(--surface-elevated-strong)] px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{getRelatedLabel(participant)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-textSecondary">
                        {participant.position ?? participant.role ?? 'Relacionamento atual'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={pending ? 'secondary' : 'outline'}
                      size="sm"
                      className="gap-2"
                      onClick={() => onToggleRemove(participant.id)}
                    >
                      {pending ? <UserPlus className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
                      {pending ? 'Reincluir' : 'Remover'}
                    </Button>
                  </div>
                )
              })}

            {!visibleRelatedPlayers.length && (
              <div className="rounded-xl border border-dashed border-borderSoft p-4 text-sm text-textSecondary">
                Nenhum atleta relacionado ainda.
              </div>
            )}
          </div>
        </div>
      </div>

      {(pendingAdds.length > 0 || pendingRemovals.length > 0) && (
        <div className="rounded-2xl border border-borderSoft/70 bg-surface-muted p-4">
          <p className="text-sm font-semibold text-textPrimary">Pendências deste lado</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingAdds.map((player) => (
              <Badge key={player.id} variant="info">
                + {player.player?.fullName ?? player.player?.nickname ?? player.playerId}
              </Badge>
            ))}
            {pendingRemovals.map((participant) => (
              <Badge key={participant.id} variant="warning">
                - {participant.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </section>
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
    eligiblePlayers,
    search,
    addIds,
    removeIds,
    setSearch,
    toggleAdd,
    toggleRemove,
    refresh,
    submitChanges
  } = useMatchRosterEditor(matchId)

  const startLabel = formatDateLabel(detail?.startAt)
  const canonicalStatus = detail?.status ?? 'scheduled'
  const statusLabel = formatMatchStatusLabel(canonicalStatus)
  const isLive = ['live', 'paused', 'halftime'].includes(String(canonicalStatus))

  const currentRelated = useMemo(() => {
    if (!detail) {
      return { home: [] as MatchControlParticipant[], away: [] as MatchControlParticipant[] }
    }

    return {
      home: detail.participants.home.filter((participant) => !participant.isStaff),
      away: detail.participants.away.filter((participant) => !participant.isStaff)
    }
  }, [detail])

  const hasChanges = addIds.length > 0 || removeIds.length > 0

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Gerenciar partida" description="Carregando dados da partida...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando contexto da partida...</span>
          </div>
        </PageWrapper>
      </DashboardShell>
    )
  }

  const subtitle = `${detail.homeTeam.name} x ${detail.awayTeam.name} • ${startLabel}`

  const matchMeta = [
    { label: 'Competição', value: detail.competitionName ?? '—' },
    { label: 'Temporada', value: detail.competitionSeason ?? detail.competitionSeasonId ?? '—' },
    { label: 'Status', value: statusLabel },
    { label: 'Início previsto', value: startLabel }
  ]

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refresh}>
      <PageWrapper
        title="Gerenciar partida"
        description={subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/matches/${matchId}/control`)}>
              <ArrowLeft className="h-4 w-4" />
              Ir ao painel
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/matches/${matchId}/edit`)}>
              Editar dados
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/matches')}>
              <RefreshCcw className="h-4 w-4" />
              Voltar à listagem
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            {(error || success) && (
              <AlertBanner variant={error ? 'error' : 'success'} message={error ?? undefined} title={success ?? undefined} />
            )}

            {isLive && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                <Clock3 className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Entrada tardia liberada</p>
                  <p className="text-sm text-emerald-50/80">
                    Atletas elegíveis podem ser relacionados agora e passam a ficar disponíveis para eventos imediatamente.
                  </p>
                </div>
              </div>
            )}

            <SideRosterCard
              title={`Mandante • ${detail.homeTeam.name}`}
              subtitle="Relacione o elenco inicial e ajuste entradas tardias antes ou durante o jogo."
              searchValue={search.home}
              onSearchChange={(value) => setSearch('home', value)}
              eligiblePlayers={eligiblePlayers.home}
              relatedPlayers={currentRelated.home}
              addIds={addIds}
              removeIds={removeIds}
              onToggleAdd={toggleAdd}
              onToggleRemove={toggleRemove}
            />

            <SideRosterCard
              title={`Visitante • ${detail.awayTeam.name}`}
              subtitle="A mesma regra vale para o outro lado da partida."
              searchValue={search.away}
              onSearchChange={(value) => setSearch('away', value)}
              eligiblePlayers={eligiblePlayers.away}
              relatedPlayers={currentRelated.away}
              addIds={addIds}
              removeIds={removeIds}
              onToggleAdd={toggleAdd}
              onToggleRemove={toggleRemove}
            />
          </div>

          <div className="space-y-4">
            <div className="card space-y-3 p-5">
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
              <p className="text-sm font-semibold text-textPrimary">Resumo operacional</p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• {currentRelated.home.length + currentRelated.away.length} atletas atualmente relacionados</li>
                <li>• {addIds.length} atletas marcados para inclusão</li>
                <li>• {removeIds.length} atletas marcados para remoção</li>
                <li>• O backend bloqueia jogadores fora do time, fora da inscrição da temporada e não relacionados no evento</li>
              </ul>
              <Button
                type="button"
                className="mt-2 w-full gap-2"
                onClick={() => submitChanges().catch(() => undefined)}
                disabled={!hasChanges || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? 'Salvando...' : 'Salvar relação da partida'}
              </Button>
              {!hasChanges && <p className="text-xs text-textSecondary">Selecione atletas para incluir ou remover antes de salvar.</p>}
            </div>

            <div className="card space-y-2 p-5 text-sm text-textSecondary">
              <p className="text-sm font-semibold text-textPrimary">Fluxo seguro</p>
              <ul className="space-y-2">
                <li>• Pré-jogo: ajuste a relação sem iniciar a partida.</li>
                <li>• Durante o jogo: a inclusão tardia é permitida apenas para atletas elegíveis.</li>
                <li>• Eventos: só aceitam atletas já relacionados no contexto da partida.</li>
              </ul>
            </div>
          </div>
        </div>
      </PageWrapper>
    </DashboardShell>
  )
}
