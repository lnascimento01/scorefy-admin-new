'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, CheckCircle2, Loader2, MapPin, Shield, Users2 } from 'lucide-react'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useMatchEditor } from '../hooks/useMatchEditor'
import type { MatchStatus } from '../types'
import type { MatchControlDetail } from '@/modules/match-control/types'

type MatchEditorState = ReturnType<typeof useMatchEditor>

function toLocalDateTimeInput(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const offset = parsed.getTimezoneOffset() * 60000
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16)
}

function parseIsoDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
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

export function MatchEditPage({ currentUser, matchId }: { currentUser: AuthProfile; matchId: string }) {
  const router = useRouter()
  const editor = useMatchEditor(matchId)
  const { detail, loading, refetch } = editor

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Editar partida" description="Carregando dados da partida...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando dados da partida...</span>
          </div>
        </PageWrapper>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch}>
      <PageWrapper
        title="Editar partida"
        description={`${detail.homeTeam.name} x ${detail.awayTeam.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/matches/${matchId}/roster`)}>
              Voltar ao elenco
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/matches')}>
              Voltar à lista
            </Button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <MatchEditForm key={detail.id} detail={detail} matchId={matchId} router={router} editor={editor} />
          <div className="space-y-4">
            <div className="card space-y-3 p-5">
              <p className="text-sm font-semibold text-textPrimary">Situação atual</p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• Status: {statusLabel[detail.status as MatchStatus] ?? detail.status}</li>
                <li>• Competição: {detail.competitionName ?? '—'}</li>
                <li>• Local: {detail.venueName ?? 'Local indefinido'}</li>
                <li>• Início previsto: {detail.startAt ? new Date(detail.startAt).toLocaleString('pt-BR') : '—'}</li>
              </ul>
              <p className="text-xs text-textSecondary">
                Alterações não impactam o elenco automaticamente. Use a aba de elenco para ajustes adicionais.
              </p>
            </div>
          </div>
        </div>
      </PageWrapper>
    </DashboardShell>
  )
}

function MatchEditForm({
  detail,
  matchId,
  router,
  editor
}: {
  detail: MatchControlDetail
  matchId: string
  router: ReturnType<typeof useRouter>
  editor: MatchEditorState
}) {
  const { competitions, teams, venues, submitting, error, success, loadTeams, update } = editor
  const [competitionId, setCompetitionId] = useState(detail.competitionId ?? '')
  const [homeTeamId, setHomeTeamId] = useState(detail.homeTeam.id ?? '')
  const [awayTeamId, setAwayTeamId] = useState(detail.awayTeam.id ?? '')
  const [venueId, setVenueId] = useState(detail.venueId ?? '')
  const [startAt, setStartAt] = useState(toLocalDateTimeInput(detail.startAt))
  const [localError, setLocalError] = useState<string | null>(null)

  const filteredTeams = useMemo(() => {
    if (!competitionId) return teams
    const fromCompetition = teams.filter((team) => team.competitionId === competitionId)
    return fromCompetition.length ? fromCompetition : teams
  }, [competitionId, teams])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!homeTeamId || !awayTeamId) {
      setLocalError('Selecione mandante e visitante.')
      return
    }
    if (homeTeamId === awayTeamId) {
      setLocalError('Mandante e visitante devem ser diferentes.')
      return
    }
    const isoStart = startAt ? parseIsoDate(startAt) : undefined
    if (startAt && !isoStart) {
      setLocalError('Informe uma data/hora válida.')
      return
    }

    await update({
      competitionId: competitionId || detail.competitionId,
      homeTeamId,
      awayTeamId,
      startAt: isoStart ?? detail.startAt,
      venueId: venueId || null
    })
  }

  return (
    <form className="card space-y-5 p-6 lg:col-span-2" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-textPrimary">Dados da partida</p>
          <p className="text-sm text-textSecondary">Atualize competição, times, local e data/hora.</p>
        </div>
      </div>

      {(error || localError || success) && (
        <AlertBanner
          variant={error || localError ? 'error' : 'success'}
          message={localError ?? error ?? undefined}
          title={success ?? undefined}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-textPrimary">
            <Shield className="h-4 w-4 text-textSecondary" />
            Competição
          </span>
          <Select
            value={competitionId}
            onChange={(event) => {
              const value = event.target.value
              setCompetitionId(value)
              loadTeams(value)
            }}
            disabled={submitting}
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
            disabled={submitting}
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
            Time mandante
          </span>
          <Select
            value={homeTeamId}
            onChange={(event) => setHomeTeamId(event.target.value)}
            disabled={submitting}
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
            Time visitante
          </span>
          <Select
            value={awayTeamId}
            onChange={(event) => setAwayTeamId(event.target.value)}
            disabled={submitting}
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
            Início previsto
          </span>
          <Input
            type="datetime-local"
            value={startAt}
            onChange={(event) => setStartAt(event.target.value)}
            disabled={submitting}
          />
          <p className="text-xs text-textSecondary">
            Enviamos timestamp em ISO 8601; backend valida `after:now`.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.push(`/matches/${matchId}/roster`)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting} className="min-w-[180px] gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {submitting ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  )
}
