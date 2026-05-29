'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { ScoreBoard } from '@/modules/match-control/components/ScoreBoard'
import { QuickActions } from '@/modules/match-control/components/QuickActions'
import { EventList } from '@/modules/match-control/components/EventList'
import { PlayerGrid, type PlayerEventAction } from '@/modules/match-control/components/PlayerGrid'
import { ControlActions } from '@/modules/match-control/components/ControlActions'
import { GoalSelectionDialog } from '@/modules/match-control/components/GoalSelectionDialog'
import { useMatchControl } from '@/modules/match-control/hooks/useMatchControl'
import { useMatchActions, type MatchControlAction } from '@/modules/match-control/hooks/useMatchActions'
import { useMatchClock, type MatchClockState } from '@/modules/match-control/hooks/useMatchClock'
import type {
  MatchControlParticipant,
  MatchQuickAction,
  MatchSide,
  MatchControlDetail,
  MatchControlTeamInfo
} from '@/modules/match-control/types'
import { ScoresheetGateway } from '@/modules/match-control/services/scoresheet.service'
import { downloadBase64File } from '@/modules/match-control/utils/files'
import { useI18n } from '@/lib/i18n'
import type { Language, TranslationRecord } from '@/lib/i18n'
import dynamic from 'next/dynamic'
import { toast } from 'react-toastify'
import { formatClock } from '@/modules/match-control/utils/time'
import {
  buildSuspensionLookup,
  getActiveSuspensions,
  groupSuspensionsBySide,
  type ActiveSuspension
} from '@/modules/match-control/utils/suspensions'
import { resolveMatchActionError } from '../utils/errors'
import {
  formatMatchStatusLabel,
  getMatchActionCapabilities
} from '../utils/status'
import 'react-toastify/dist/ReactToastify.css'

const ToastViewport = dynamic(async () => {
  const mod = await import('react-toastify')
  return { default: mod.ToastContainer }
}, { ssr: false })

interface MatchControlPageProps {
  currentUser: AuthProfile
  matchId: string
}

function resolveMatchPeriodLabel({
  status,
  statusLabel,
  period,
  periodLabel,
  elapsedSeconds
}: {
  status: string
  statusLabel?: string | null
  period?: number | null
  periodLabel?: string | null
  elapsedSeconds?: number | null
}) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase()
  const fallbackPeriodLabel = periodLabel?.trim() || null
  const fallbackStatusLabel = statusLabel?.trim() || null
  const resolvedElapsed = Number.isFinite(elapsedSeconds ?? NaN) ? Number(elapsedSeconds) : 0
  const resolvedPeriod = Number.isFinite(period ?? NaN) ? Number(period) : 0

  if (['scheduled', 'not_started', 'pending'].includes(normalizedStatus)) {
    return 'Pré-jogo'
  }

  if (['live', 'in_progress', 'started'].includes(normalizedStatus)) {
    if (fallbackPeriodLabel) {
      return fallbackPeriodLabel
    }
    if (resolvedPeriod > 0) {
      if (resolvedPeriod === 1) return '1º Tempo'
      if (resolvedPeriod === 2) return '2º Tempo'
      if (resolvedPeriod === 3) return 'Prorrogação'
      if (resolvedPeriod === 4) return 'Penais'
      return `Período ${resolvedPeriod}`
    }
    return resolvedElapsed >= 30 * 60 ? '2º Tempo' : '1º Tempo'
  }

  if (normalizedStatus === 'finished' || normalizedStatus === 'final') {
    return fallbackPeriodLabel ?? fallbackStatusLabel ?? 'Finalizado'
  }

  if (normalizedStatus === 'paused') {
    if (fallbackPeriodLabel) {
      return fallbackPeriodLabel
    }
    if (resolvedPeriod > 0) {
      if (resolvedPeriod === 1) return '1º Tempo'
      if (resolvedPeriod === 2) return '2º Tempo'
      if (resolvedPeriod === 3) return 'Prorrogação'
      if (resolvedPeriod === 4) return 'Penais'
      return `Período ${resolvedPeriod}`
    }
    if (resolvedElapsed > 0) {
      return resolvedElapsed >= 30 * 60 ? '2º Tempo' : '1º Tempo'
    }
    return fallbackStatusLabel ?? 'Jogo pausado'
  }

  if (normalizedStatus === 'halftime' || normalizedStatus === 'interval') {
    return fallbackPeriodLabel ?? fallbackStatusLabel ?? 'Intervalo'
  }

  if (fallbackPeriodLabel) {
    return fallbackPeriodLabel
  }

  if (resolvedPeriod > 0) {
    if (resolvedPeriod === 1) return '1º Tempo'
    if (resolvedPeriod === 2) return '2º Tempo'
    if (resolvedPeriod === 3) return 'Prorrogação'
    if (resolvedPeriod === 4) return 'Penais'
    return `Período ${resolvedPeriod}`
  }

  if (resolvedElapsed > 0) {
    return resolvedElapsed >= 30 * 60 ? '2º Tempo' : '1º Tempo'
  }

  return fallbackStatusLabel ?? 'Pré-jogo'
}

export function MatchControlPage({ currentUser, matchId }: MatchControlPageProps) {
  const router = useRouter()
  const { dictionary, language } = useI18n()
  const matchControlCopy = dictionary.matchControl
  const {
    detail,
    snapshot,
    events,
    quickActions,
    loading,
    error,
    actionMessage,
    clearMessage,
    triggerQuickAction,
    eventLoading,
    reload,
    lastSyncAt,
    pendingEvents,
    networkStatus,
    timeoutState,
    clearTimeout,
    deleteEvent,
  } = useMatchControl(matchId)
  // subscribe immediately on mount so the initial event is captured, seeding with backend clock if present
  const matchClockState = useMatchClock(matchId, snapshot ?? undefined)
  const {
    start,
    pause,
    resume,
    finish,
    startNextPeriod,
    cancel,
    adjustTime,
    loadingAction,
    message: actionFeedback,
    clearMessage: clearActionFeedback,
    error: actionError,
    clearError: clearActionError
  } = useMatchActions()

  const [selection, setSelection] = useState<{ action: MatchQuickAction; team: MatchSide } | null>(
    null
  )
  const [scoresheetLoading, setScoresheetLoading] = useState(false)
  const [scoresheetMessage, setScoresheetMessage] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [clockDialogOpen, setClockDialogOpen] = useState(false)
  const [clockInput, setClockInput] = useState('00:00')
  const [clockError, setClockError] = useState<string | null>(null)
  const [clockSaving, setClockSaving] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  const rawStatus = snapshot?.status ?? detail?.status ?? 'scheduled'
  const statusLabel = snapshot?.statusLabel ?? formatMatchStatusLabel(rawStatus, dictionary.dashboard.status)
  const periodLabel = useMemo(
    () =>
      resolveMatchPeriodLabel({
        status: rawStatus,
        statusLabel,
        period: snapshot?.period ?? detail?.period,
        periodLabel: snapshot?.periodLabel,
        elapsedSeconds: snapshot?.elapsedSeconds ?? 0
      }),
    [
      detail?.period,
      rawStatus,
      snapshot?.elapsedSeconds,
      snapshot?.period,
      snapshot?.periodLabel,
      statusLabel
    ]
  )
  const participantLookup = useMemo(() => buildParticipantLookup(detail), [detail])
  const activeSuspensions = useMemo(
    () => getActiveSuspensions(events, matchClockState.elapsedSeconds),
    [events, matchClockState.elapsedSeconds]
  )
  const enrichedSuspensions = useMemo(
    () => activeSuspensions.map((suspension) => enrichSuspensionDisplay(suspension, participantLookup.get(suspension.playerId))),
    [activeSuspensions, participantLookup]
  )
  const suspensionsByPlayerId = useMemo(
    () => buildSuspensionLookup(activeSuspensions),
    [activeSuspensions]
  )
  const suspensionsBySide = useMemo(
    () => groupSuspensionsBySide(enrichedSuspensions),
    [enrichedSuspensions]
  )
  const homeSuspensions = useMemo(
    () => suspensionsBySide.home,
    [suspensionsBySide.home]
  )
  const awaySuspensions = useMemo(
    () => suspensionsBySide.away,
    [suspensionsBySide.away]
  )
  const {
    canStart,
    canPause,
    canResume,
    canFinish,
    canStartNextPeriod,
    canCancel: canCancelMatch,
    canGenerateScoresheet,
    isTerminal
  } = getMatchActionCapabilities(rawStatus)
  const actionsLocked = eventLoading || loadingAction !== null || isTerminal

  const scoreboardHome = detail ? { ...detail.homeTeam } : null
  const scoreboardAway = detail ? { ...detail.awayTeam } : null

  const handleQuickAction = (action: MatchQuickAction) => {
    if (actionsLocked) return
    if (action.team === 'both') return
    if (action.requiresPlayer) {
      setSelection({ action, team: action.team })
      return
    }
    triggerQuickAction(action, { team: action.team }).catch(() => undefined)
  }

  const handleSelectPlayer = (playerId: string) => {
    if (actionsLocked) return
    if (!selection) return
    triggerQuickAction(selection.action, { team: selection.team, playerId }).catch(() => undefined)
    setSelection(null)
  }

  const playersForSelection = useMemo<MatchControlParticipant[]>(() => {
    if (!selection || !detail) return []
    return selection.team === 'home' ? detail.participants.home : detail.participants.away
  }, [selection, detail])

  const playerEventActions = useMemo<PlayerEventAction[]>(() => {
    const labels = matchControlCopy.playerActions
    return [
      { id: 'goal', label: labels.goal, typeCode: 'goal', variant: 'primary' },
      { id: 'yellow-card', label: labels.yellowCard, typeCode: 'yellow_card', variant: 'warning' },
      { id: 'red-card', label: labels.redCard, typeCode: 'red_card', variant: 'danger' },
      { id: 'two-minutes', label: labels.twoMinutes, typeCode: 'suspension_2min_start', variant: 'info' },
      { id: 'blue-card', label: labels.blueCard, typeCode: 'blue_card', variant: 'secondary' }
    ]
  }, [matchControlCopy.playerActions])

  const handlePlayerEvent = useCallback(
    (team: MatchSide, playerId: string, action: PlayerEventAction) => {
      if (actionsLocked) return
      if (!playerId) return
      const quickAction: MatchQuickAction = {
        id: `${team}-${action.id}`,
        label: action.label,
        team,
        typeCode: action.typeCode,
        requiresPlayer: true
      }
      triggerQuickAction(quickAction, { team, playerId }).catch(() => undefined)
    },
    [actionsLocked, triggerQuickAction]
  )

  const handleDownloadScoresheet = async () => {
    setScoresheetMessage(null)
    setScoresheetLoading(true)
    try {
      const payload = await ScoresheetGateway.fetch(matchId)
      downloadBase64File(payload.base64, payload.filename, payload.mime)
      setScoresheetMessage(matchControlCopy.alerts.scoresheetSuccess)
    } catch (err) {
      console.error('Failed to generate scoresheet', err)
      setScoresheetMessage(resolveMatchActionError(err, matchControlCopy.alerts.scoresheetError))
    } finally {
      setScoresheetLoading(false)
    }
  }

  const handleToggleFullscreen = () => {
    if (typeof document === 'undefined') return
    if (!isFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => undefined)
    } else if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen().catch(() => undefined)
    }
  }

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    if (!actionError) return
    toast.error(actionError, { toastId: actionError, theme: 'dark' })
    clearActionError()
  }, [actionError, clearActionError])

  const handleControlAction = useCallback(
    async (action: MatchControlAction, payload?: { reason?: string }) => {
      try {
        if (action === 'start') await start(matchId)
        if (action === 'pause') await pause(matchId, payload)
        if (action === 'resume') await resume(matchId)
        if (action === 'finish') await finish(matchId)
        if (action === 'startNextPeriod') await startNextPeriod(matchId)
        if (action === 'cancel') await cancel(matchId)
      } finally {
        await reload()
      }
    },
    [cancel, finish, matchId, pause, reload, resume, start, startNextPeriod]
  )

  useEffect(() => {
    if (clockDialogOpen) {
      const initialSeconds = snapshot?.elapsedSeconds ?? 0
      setClockInput(formatClock(initialSeconds))
      setClockError(null)
    }
  }, [clockDialogOpen, snapshot?.elapsedSeconds])

  const handleClockSave = async () => {
    const seconds = parseClockValue(clockInput)
    if (seconds === null) {
      setClockError('Informe um horário válido (MM:SS).')
      return
    }
    setClockSaving(true)
    try {
      await adjustTime(matchId, seconds)
      setClockDialogOpen(false)
    } catch {
      setClockError('Não foi possível atualizar o cronômetro.')
    } finally {
      setClockSaving(false)
    }
  }

  useEffect(() => {
    if (isTerminal) {
      setSelection(null)
      setClockDialogOpen(false)
      clearTimeout()
    }
  }, [clearTimeout, isTerminal])

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={() => { void reload() }}>
      <ToastViewport position="top-right" newestOnTop pauseOnHover={false} closeOnClick theme="dark" />
      <PageWrapper compact>
        {error && <AlertBanner variant="warning" message={error} />}
        {actionMessage && (
          <AlertBanner variant="success" message={actionMessage}>
            <button
              type="button"
              onClick={clearMessage}
              className="text-xs font-semibold text-secondary underline"
            >
              {dictionary.actions.dismiss}
            </button>
          </AlertBanner>
        )}
        {actionFeedback && (
          <AlertBanner variant="info" message={actionFeedback}>
            <button
              type="button"
              onClick={clearActionFeedback}
              className="text-xs font-semibold text-secondary underline"
            >
              {dictionary.actions.dismiss}
            </button>
          </AlertBanner>
        )}
        {timeoutState && (
          <AlertBanner
            variant="info"
            message={matchControlCopy.alerts.timeout
              .replace('{team}', timeoutState.team === 'home' ? matchControlCopy.labels.homeTeam : matchControlCopy.labels.awayTeam)
              .replace('{seconds}', String(timeoutState.remaining))}
          >
            <button
              type="button"
              onClick={clearTimeout}
              className="text-xs font-semibold text-secondary underline"
            >
              {matchControlCopy.alerts.dismissTimeout}
            </button>
          </AlertBanner>
        )}
        {scoresheetMessage && <AlertBanner variant="info" message={scoresheetMessage} />}

        <section className="card space-y-3 p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={() => router.push('/matches')}>
                {matchControlCopy.header.back}
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-textSecondary">{matchControlCopy.header.breadcrumb}</p>
                <p className="truncate text-lg font-semibold text-textPrimary">{matchControlCopy.header.title}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill
                label={networkStatus === 'online' ? matchControlCopy.badges.online : matchControlCopy.badges.offline}
                variant={networkStatus === 'online' ? 'success' : 'warning'}
              />
              <StatusPill
                label={matchControlCopy.badges.pending.replace('{count}', String(pendingEvents))}
                variant={pendingEvents ? 'warning' : 'info'}
              />
              <StatusPill
                label={`${matchControlCopy.badges.lastSync}: ${formatTimestamp(lastSyncAt, language)}`}
                variant="info"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => { void reload() }}>
              {matchControlCopy.header.syncNow}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { void reload() }}>
              {matchControlCopy.header.reload}
            </Button>
            <Button size="sm" variant="outline" onClick={handleToggleFullscreen}>
              {isFullscreen ? matchControlCopy.header.fullscreen.exit : matchControlCopy.header.fullscreen.enter}
            </Button>
            {canGenerateScoresheet && (
              <Button size="sm" onClick={handleDownloadScoresheet} disabled={scoresheetLoading}>
                {scoresheetLoading ? matchControlCopy.header.scoresheet.loading : matchControlCopy.header.scoresheet.view}
              </Button>
            )}
          </div>

          {loading && (
            <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center text-sm text-textSecondary">
              {matchControlCopy.loading}
            </div>
          )}

          {!loading && detail && scoreboardHome && scoreboardAway && (
            <div className="space-y-3">
              <MatchOverviewCard
                detail={detail}
                home={scoreboardHome}
                away={scoreboardAway}
                periodLabel={periodLabel}
                statusLabel={statusLabel}
                dictionary={matchControlCopy}
                language={language}
                onEditClock={!isTerminal ? () => setClockDialogOpen(true) : undefined}
                clockState={matchClockState}
                homeSuspensions={homeSuspensions}
                awaySuspensions={awaySuspensions}
              />

              <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
                <PlayerGrid
                  title={matchControlCopy.labels.homeTeam}
                  participants={detail.participants.home}
                  side="home"
                  actions={playerEventActions}
                  suspensionsByPlayerId={suspensionsByPlayerId}
                  disabled={actionsLocked}
                  onTriggerEvent={(playerId, action) => handlePlayerEvent('home', playerId, action)}
                />

                <div className="space-y-3 xl:sticky xl:top-4 xl:flex xl:h-[calc(100vh-8rem)] xl:flex-col xl:overflow-hidden">
                  <ControlActions
                    statusLabel={statusLabel}
                    canStart={canStart}
                    canPause={Boolean(canPause)}
                    canResume={Boolean(canResume)}
                    canFinish={Boolean(canFinish)}
                    canStartNextPeriod={Boolean(canStartNextPeriod)}
                    canCancel={Boolean(canCancelMatch)}
                    loadingAction={loadingAction}
                    onAction={(action, payload) => handleControlAction(action, payload)}
                    lastSync={lastSyncAt}
                    isTerminal={isTerminal}
                    disabled={actionsLocked}
                  />
                  <QuickActions
                    actions={quickActions}
                    onTrigger={handleQuickAction}
                    disabled={actionsLocked}
                    variant="compact"
                  />
                  <BroadcastCard
                    url={detail.broadcastUrl}
                    dictionary={matchControlCopy}
                    open={broadcastOpen}
                    onToggle={() => setBroadcastOpen((prev) => !prev)}
                  />
                  <EventList
                    events={events}
                    loading={loading}
                    onDeleteEvent={(event) => { void deleteEvent(event.id) }}
                    canDeleteEvents={!isTerminal && !actionsLocked}
                    className="xl:flex-1 xl:min-h-0"
                  />
                </div>

                <div className="space-y-3">
                <PlayerGrid
                  title={matchControlCopy.labels.awayTeam}
                  participants={detail.participants.away}
                  side="away"
                  actions={playerEventActions}
                    suspensionsByPlayerId={suspensionsByPlayerId}
                  disabled={actionsLocked}
                  onTriggerEvent={(playerId, action) => handlePlayerEvent('away', playerId, action)}
                />
                </div>
              </div>
            </div>
          )}
        </section>
      </PageWrapper>

      <GoalSelectionDialog
        open={Boolean(selection)}
        action={selection?.action ?? null}
        players={playersForSelection}
        team={selection?.team ?? null}
        onSelect={handleSelectPlayer}
        onClose={() => setSelection(null)}
      />

      <ClockAdjustDialog
        open={clockDialogOpen}
        value={clockInput}
        error={clockError}
        loading={clockSaving}
        onChange={(value) => {
          setClockInput(value)
          if (clockError) setClockError(null)
        }}
        onClose={() => {
          if (!clockSaving) setClockDialogOpen(false)
        }}
        onSubmit={handleClockSave}
      />
    </DashboardShell>
  )
}

const localeMap: Record<Language, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

function formatTimestamp(
  timestamp?: string | null,
  language: Language = 'pt',
  options?: Intl.DateTimeFormatOptions
) {
  if (!timestamp) return '—'
  try {
    return new Date(timestamp).toLocaleString(localeMap[language] ?? 'pt-BR', options ?? { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

type MatchControlDictionary = TranslationRecord['matchControl']

function MatchOverviewCard({
  detail,
  home,
  away,
  periodLabel,
  statusLabel,
  dictionary,
  language,
  onEditClock,
  clockState,
  homeSuspensions,
  awaySuspensions
}: {
  detail: MatchControlDetail
  home: MatchControlTeamInfo
  away: MatchControlTeamInfo
  periodLabel: string
  statusLabel: string
  dictionary: MatchControlDictionary
  language: Language
  onEditClock?: () => void
  clockState: MatchClockState
  homeSuspensions: ActiveSuspension[]
  awaySuspensions: ActiveSuspension[]
}) {
  const startDate = detail.startAt
    ? formatTimestamp(detail.startAt, language, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    : '—'
  return (
    <section className="card space-y-3 p-3 md:p-4">
      <ScoreBoard
        home={home}
        away={away}
        periodLabel={periodLabel}
        statusLabel={statusLabel}
        competitionName={[detail.competitionName, detail.competitionSeason].filter(Boolean).join(' • ') || undefined}
        onEditClock={onEditClock}
        clockState={clockState}
        homeSuspensions={homeSuspensions}
        awaySuspensions={awaySuspensions}
        variant="compact"
      />
      <p className="text-[11px] text-textSecondary">
        {(detail.venueName ?? dictionary.overview.noVenue)} • {startDate}
      </p>
    </section>
  )
}

function BroadcastCard({
  url,
  dictionary,
  open,
  onToggle
}: {
  url?: string | null
  dictionary: MatchControlDictionary
  open: boolean
  onToggle: () => void
}) {
  const resolvedUrl = url ? resolveBroadcastUrl(url) : null
  return (
    <section className="card space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-textSecondary">{dictionary.broadcast.title}</p>
        {resolvedUrl && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={onToggle}>
            {open ? 'Ocultar' : 'Ver transmissão'}
          </Button>
        )}
      </div>
      {resolvedUrl ? (
        open ? (
          <div className="aspect-video max-h-36 w-full overflow-hidden rounded-xl border border-borderSoft/50 bg-surface-muted">
            <iframe
              title={dictionary.broadcast.title}
              src={resolvedUrl}
              className="h-full w-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <p className="rounded-lg border border-borderSoft/40 bg-surface-muted px-3 py-2 text-[11px] text-textSecondary">
            Transmissão disponível. Clique em “Ver transmissão”.
          </p>
        )
      ) : (
        <p className="rounded-lg border border-dashed border-borderSoft/60 px-3 py-2 text-[11px] text-textSecondary">
          {dictionary.broadcast.empty}
        </p>
      )}
    </section>
  )
}

function StatusPill({ label, variant }: { label: string; variant: 'success' | 'info' | 'warning' | 'danger' }) {
  const variantClass: Record<'success' | 'info' | 'warning' | 'danger', string> = {
    success: 'bg-emerald-500/15 text-emerald-400',
    info: 'bg-sky-500/15 text-sky-300',
    warning: 'bg-amber-500/20 text-amber-300',
    danger: 'bg-rose-500/20 text-rose-300'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${variantClass[variant]}`}>
      {label}
    </span>
  )
}

function resolveBroadcastUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/embed/')) return rawUrl
      const videoId = url.searchParams.get('v')
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`
      }
    }
    if (host === 'youtu.be') {
      const videoId = url.pathname.replace('/', '')
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`
      }
    }
    return rawUrl
  } catch {
    return rawUrl
  }
}

function buildParticipantLookup(detail: MatchControlDetail | null): Map<string, MatchControlParticipant> {
  const lookup = new Map<string, MatchControlParticipant>()
  if (!detail) return lookup
  detail.participants.home.forEach((participant) => {
    lookup.set(participant.id, participant)
  })
  detail.participants.away.forEach((participant) => {
    lookup.set(participant.id, participant)
  })
  return lookup
}

function enrichSuspensionDisplay(
  suspension: ActiveSuspension,
  participant?: MatchControlParticipant
): ActiveSuspension & { displayLabel: string } {
  const shirtNumber = participant?.shirtNumber
  const participantLabel =
    participant?.nick?.trim() ||
    participant?.name?.trim() ||
    suspension.playerName?.trim() ||
    'Atleta'

  return {
    ...suspension,
    team: suspension.team ?? participant?.team,
    playerName: suspension.playerName ?? participant?.name ?? participant?.nick,
    displayLabel: typeof shirtNumber === 'number' ? `#${shirtNumber} ${participantLabel}` : participantLabel
  }
}

function ClockAdjustDialog({
  open,
  value,
  error,
  loading,
  onChange,
  onClose,
  onSubmit
}: {
  open: boolean
  value: string
  error: string | null
  loading: boolean
  onChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open) return null

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 4)
    const minutes = digits.slice(0, 2)
    const seconds = digits.slice(2, 4)
    const formatted = seconds ? `${minutes}:${seconds}` : minutes
    onChange(formatted)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md space-y-4 rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] p-6 text-textPrimary shadow-2xl">
        <div>
          <p className="text-lg font-semibold">Ajustar cronômetro</p>
          <p className="text-sm text-textSecondary">Informe o tempo no formato MM:SS para sincronizar o relógio oficial.</p>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder="Ex.: 32:45"
            className="w-full rounded-xl border border-borderSoft bg-surface-muted px-4 py-3 font-mono text-lg text-textPrimary focus:border-secondary focus:outline-none"
          />
          {error && <p className="text-xs text-primary">{error}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function parseClockValue(value: string): number | null {
  const parts = value.split(':').map((part) => part.trim())
  if (parts.length !== 2) return null
  const minutes = Number(parts[0])
  const seconds = Number(parts[1])
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
  if (minutes < 0 || seconds < 0 || seconds >= 60) return null
  return minutes * 60 + seconds
}
