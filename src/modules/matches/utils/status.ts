import type { MatchStatus } from '../types'

export type CanonicalMatchStatus =
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'

export type MatchStatusVariant = 'info' | 'warning' | 'success' | 'danger'

export type MatchTransitionAction = 'start' | 'pause' | 'resume' | 'startNextPeriod'

export interface MatchTransitionDefinition {
  action: MatchTransitionAction
  label: string
  loadingLabel: string
}

const DEFAULT_STATUS_LABELS: Record<CanonicalMatchStatus, string> = {
  scheduled: 'Agendada',
  live: 'Ao vivo',
  paused: 'Pausada',
  halftime: 'Intervalo',
  finished: 'Finalizada',
  postponed: 'Adiada',
  cancelled: 'Cancelada'
}

const PRIMARY_ACTIONS: Record<MatchTransitionAction, MatchTransitionDefinition> = {
  start: {
    action: 'start',
    label: 'Iniciar',
    loadingLabel: 'Iniciando...'
  },
  pause: {
    action: 'pause',
    label: 'Pausar',
    loadingLabel: 'Pausando...'
  },
  resume: {
    action: 'resume',
    label: 'Retomar',
    loadingLabel: 'Retomando...'
  },
  startNextPeriod: {
    action: 'startNextPeriod',
    label: 'Iniciar 2º tempo',
    loadingLabel: 'Iniciando 2º tempo...'
  }
}

export function normalizeMatchStatus(status?: string | MatchStatus | null): CanonicalMatchStatus {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()

  if (['live', 'in_progress', 'started'].includes(normalized)) return 'live'
  if (['paused', 'timeout'].includes(normalized)) return 'paused'
  if (['halftime', 'half_time', 'interval'].includes(normalized)) return 'halftime'
  if (['finished', 'final', 'completed'].includes(normalized)) return 'finished'
  if (normalized === 'postponed') return 'postponed'
  if (['cancelled', 'canceled'].includes(normalized)) return 'cancelled'

  return 'scheduled'
}

export function formatMatchStatusLabel(status?: string | MatchStatus | null, labels?: Record<string, string>): string {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
  const canonical = normalizeMatchStatus(status)

  return labels?.[normalized] ?? labels?.[canonical] ?? DEFAULT_STATUS_LABELS[canonical]
}

export function getMatchStatusVariant(status?: string | MatchStatus | null): MatchStatusVariant {
  const canonical = normalizeMatchStatus(status)

  if (canonical === 'live') return 'danger'
  if (canonical === 'paused' || canonical === 'halftime' || canonical === 'postponed') return 'warning'
  if (canonical === 'finished') return 'success'

  return canonical === 'cancelled' ? 'danger' : 'info'
}

export function getMatchPrimaryAction(status?: string | MatchStatus | null): MatchTransitionDefinition | null {
  const canonical = normalizeMatchStatus(status)

  if (canonical === 'scheduled') return PRIMARY_ACTIONS.start
  if (canonical === 'live') return PRIMARY_ACTIONS.pause
  if (canonical === 'paused') return PRIMARY_ACTIONS.resume
  if (canonical === 'halftime') return PRIMARY_ACTIONS.startNextPeriod

  return null
}

export function getMatchActionCapabilities(status?: string | MatchStatus | null) {
  const canonicalStatus = normalizeMatchStatus(status)

  return {
    canonicalStatus,
    canStart: canonicalStatus === 'scheduled',
    canPause: canonicalStatus === 'live',
    canResume: canonicalStatus === 'paused',
    canFinish: canonicalStatus === 'live' || canonicalStatus === 'paused' || canonicalStatus === 'halftime',
    canStartNextPeriod: canonicalStatus === 'halftime',
    canCancel: canonicalStatus !== 'finished' && canonicalStatus !== 'cancelled',
    canGenerateScoresheet: canonicalStatus === 'finished',
    isTerminal: canonicalStatus === 'finished' || canonicalStatus === 'cancelled'
  }
}
