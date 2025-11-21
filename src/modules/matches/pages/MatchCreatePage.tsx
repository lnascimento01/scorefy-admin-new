'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, MapPin, RefreshCcw, Shield, Users2 } from 'lucide-react'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useMatchCreation } from '../hooks/useMatchCreation'
import type { MatchCreatePayload } from '../types'
import type { MatchControlDetail, MatchControlParticipant } from '@/modules/match-control/types'

const MATCH_CONTROL_BASE_PATH = (process.env.NEXT_PUBLIC_MATCH_CONTROL_BASE_PATH ?? '/matches').replace(/\/$/, '')

function toLocalDateTimeInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

function parseIsoDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function RosterColumn({ title, participants }: { title: string; participants: MatchControlParticipant[] }) {
  return (
    <div className="rounded-xl border border-borderSoft/60 bg-surface-muted p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">{title}</p>
      <div className="mt-2 space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between rounded-lg bg-[var(--surface-elevated-strong)] px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-textPrimary">{participant.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-textSecondary">
                {participant.position ?? participant.role ?? (participant.isStaff ? 'Staff' : 'Jogador')}
              </p>
            </div>
            {typeof participant.shirtNumber === 'number' && (
              <span className="text-xs font-bold text-textSecondary">#{participant.shirtNumber}</span>
            )}
          </div>
        ))}
        {!participants.length && (
          <p className="rounded-lg border border-dashed border-borderSoft bg-[var(--surface-elevated-strong)] px-3 py-2 text-xs text-textSecondary">
            Nenhum atleta ativo retornado para este time.
          </p>
        )}
      </div>
    </div>
  )
}

function RosterPreview({ detail }: { detail: MatchControlDetail }) {
  const homeCount = detail.participants.home.length
  const awayCount = detail.participants.away.length
  const total = homeCount + awayCount

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-textSecondary">Elencos sincronizados</p>
          <p className="text-base font-semibold text-textPrimary">
            {detail.homeTeam.name} x {detail.awayTeam.name}
          </p>
          <p className="text-xs text-textSecondary">
            A API copiou automaticamente os atletas ativos para esta partida.
          </p>
        </div>
        <span className="rounded-full bg-tertiary/10 px-3 py-1 text-xs font-semibold text-tertiary">
          {total} participantes
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <RosterColumn title={`Mandante • ${homeCount} atletas`} participants={detail.participants.home} />
        <RosterColumn title={`Visitante • ${awayCount} atletas`} participants={detail.participants.away} />
      </div>
    </div>
  )
}

export function MatchCreatePage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const {
    competitions,
    teams,
    venues,
    loadingCatalog,
    loadingTeams,
    submitting,
    error,
    created,
    reloadCatalog,
    loadTeams,
    create
  } = useMatchCreation()

  const [competitionId, setCompetitionId] = useState('')
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [venueId, setVenueId] = useState('')
  const [startAt, setStartAt] = useState(() => {
    const base = new Date()
    base.setHours(base.getHours() + 2, 0, 0, 0)
    return toLocalDateTimeInput(base)
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const filteredTeams = useMemo(() => {
    if (!competitionId) return teams
    const fromCompetition = teams.filter((team) => team.competitionId === competitionId)
    return fromCompetition.length ? fromCompetition : teams
  }, [competitionId, teams])

  const allDisabled = submitting || loadingCatalog

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!competitionId || !homeTeamId || !awayTeamId || !startAt) {
      setLocalError('Preencha todos os campos obrigatórios.')
      return
    }
    if (homeTeamId === awayTeamId) {
      setLocalError('Selecione equipes diferentes para mandante e visitante.')
      return
    }

    const startAtIso = parseIsoDate(startAt)
    if (!startAtIso) {
      setLocalError('Informe uma data/hora válida no formato ISO.')
      return
    }

    const payload: MatchCreatePayload = {
      competitionId,
      homeTeamId,
      awayTeamId,
      startAt: startAtIso,
      venueId: venueId || undefined
    }

    const result = await create(payload)
    if (result) {
      setHomeTeamId('')
      setAwayTeamId('')
    }
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={reloadCatalog}>
      <PageWrapper
        title="Criar nova partida"
        description="Agende partidas com mandante, visitante e competição, já com elenco sincronizado pelo backend."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/matches')} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Voltar para lista
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <form className="card space-y-5 p-6 lg:col-span-2" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-textPrimary">Dados da partida</p>
                <p className="text-sm text-textSecondary">Preencha campos mínimos exigidos pelo endpoint de criação.</p>
              </div>
            </div>

            {(error || localError) && (
              <AlertBanner variant="error" message={localError ?? error ?? undefined} />
            )}

            {created && (
              <AlertBanner variant="success" title="Partida criada">
                <p className="text-sm text-textSecondary">
                  O elenco inicial já foi copiado dos times. Você pode abrir o painel de controle para iniciar a operação.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => router.push(`${MATCH_CONTROL_BASE_PATH}/${created.id}/control`)}
                    size="sm"
                    className="gap-2"
                  >
                    <Users2 className="h-4 w-4" />
                    Abrir painel da partida
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/matches')}
                  >
                    Ver listagem
                  </Button>
                </div>
              </AlertBanner>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
                  <Shield className="h-4 w-4 text-textSecondary" />
                  Competição *
                </span>
                <Select
                  value={competitionId}
                  onChange={(event) => {
                    const value = event.target.value
                    setCompetitionId(value)
                    loadTeams(value)
                  }}
                  disabled={allDisabled}
                >
                  <option value="">Selecione a competição</option>
                  {competitions.map((competition) => (
                    <option key={competition.id} value={competition.id}>
                      {competition.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
                  <MapPin className="h-4 w-4 text-textSecondary" />
                  Arena (opcional)
                </span>
                <Select
                  value={venueId}
                  onChange={(event) => setVenueId(event.target.value)}
                  disabled={allDisabled}
                >
                  <option value="">Definir depois</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
                  <Users2 className="h-4 w-4 text-textSecondary" />
                  Time mandante *
                </span>
                <Select
                  value={homeTeamId}
                  onChange={(event) => setHomeTeamId(event.target.value)}
                  disabled={allDisabled || loadingTeams}
                >
                  <option value="">Selecione o mandante</option>
                  {filteredTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
                  <Users2 className="h-4 w-4 text-textSecondary" />
                  Time visitante *
                </span>
                <Select
                  value={awayTeamId}
                  onChange={(event) => setAwayTeamId(event.target.value)}
                  disabled={allDisabled || loadingTeams}
                >
                  <option value="">Selecione o visitante</option>
                  {filteredTeams.map((team) => (
                    <option key={`${team.id}-away`} value={team.id}>
                      {team.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
                  <CalendarClock className="h-4 w-4 text-textSecondary" />
                  Início previsto *
                </span>
                <Input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  disabled={allDisabled}
                />
                <p className="text-xs text-textSecondary">
                  O backend valida `after:now` automaticamente; enviamos timestamp ISO 8601.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.push('/matches')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={allDisabled} className="min-w-[160px] gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Criando partida...' : 'Criar partida'}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="card space-y-3 p-5">
              <p className="text-sm font-semibold text-textPrimary">Como funciona</p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• O endpoint POST /api/v1/auth/matches cria a partida e copia jogadores ativos de ambos os times.</li>
                <li>• Use a resposta para exibir o elenco inicial; abas mandante/visitante são filtradas por `team_id`.</li>
                <li>• Ajustes posteriores devem usar PATCH /matches/{'{id}'}/players, enviando add/remove atomizados.</li>
              </ul>
              <p className="text-xs text-textSecondary">
                Erros de validação (422) retornam mensagens detalhadas — exibimos o primeiro erro recebido.
              </p>
            </div>

            {created ? (
              <RosterPreview detail={created} />
            ) : (
              <div className="card space-y-3 p-5">
                <p className="text-sm font-semibold text-textPrimary">Sincronização de elenco</p>
                <ul className="space-y-2 text-sm text-textSecondary">
                  <li>• Mínimo de 7 atletas é validado no backend durante atualizações.</li>
                  <li>• Jogadores desativados após a criação não são removidos automaticamente.</li>
                  <li>• Consulte o painel da partida para iniciar o fluxo ao vivo e registrar eventos.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </DashboardShell>
  )
}
