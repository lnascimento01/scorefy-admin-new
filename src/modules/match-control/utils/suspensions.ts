import type { MatchControlEvent, MatchSide } from '../types'

export interface ActiveSuspension {
  eventId: string
  playerId: string
  team?: MatchSide
  playerName?: string
  startSeconds: number
  remainingSeconds: number
  expiresAtSeconds: number
}

const SUSPENSION_DURATION_SECONDS = 120

export function getActiveSuspensions(
  events: MatchControlEvent[],
  currentMatchTimeSeconds: number
): ActiveSuspension[] {
  const safeCurrentSeconds = Math.max(0, Math.floor(currentMatchTimeSeconds))
  const byPlayerId = new Map<string, ActiveSuspension>()

  events.forEach((event) => {
    if (!event.playerId || !event.typeCode || !isSuspensionStartEvent(event.typeCode)) {
      return
    }

    const startSeconds = typeof event.matchTimeSeconds === 'number' && Number.isFinite(event.matchTimeSeconds)
      ? Math.max(0, Math.floor(event.matchTimeSeconds))
      : 0
    const expiresAtSeconds = startSeconds + SUSPENSION_DURATION_SECONDS
    const remainingSeconds = expiresAtSeconds - safeCurrentSeconds

    if (remainingSeconds <= 0) {
      return
    }

    const nextSuspension: ActiveSuspension = {
      eventId: event.id,
      playerId: event.playerId,
      team: event.team,
      playerName: event.playerName ?? undefined,
      startSeconds,
      remainingSeconds,
      expiresAtSeconds
    }

    const currentSuspension = byPlayerId.get(event.playerId)
    if (
      !currentSuspension ||
      nextSuspension.remainingSeconds > currentSuspension.remainingSeconds ||
      (nextSuspension.remainingSeconds === currentSuspension.remainingSeconds &&
        nextSuspension.startSeconds > currentSuspension.startSeconds)
    ) {
      byPlayerId.set(event.playerId, nextSuspension)
    }
  })

  return [...byPlayerId.values()].sort((a, b) => {
    if (a.remainingSeconds !== b.remainingSeconds) {
      return b.remainingSeconds - a.remainingSeconds
    }
    if (a.startSeconds !== b.startSeconds) {
      return b.startSeconds - a.startSeconds
    }
    return a.playerId.localeCompare(b.playerId, undefined, { numeric: true, sensitivity: 'base' })
  })
}

export function groupSuspensionsBySide(
  suspensions: ActiveSuspension[]
): Record<MatchSide, ActiveSuspension[]> {
  const grouped: Record<MatchSide, ActiveSuspension[]> = {
    home: [],
    away: []
  }

  suspensions.forEach((suspension) => {
    if (suspension.team === 'home') {
      grouped.home.push(suspension)
      return
    }
    if (suspension.team === 'away') {
      grouped.away.push(suspension)
    }
  })

  grouped.home.sort(sortSuspensionsDesc)
  grouped.away.sort(sortSuspensionsDesc)
  return grouped
}

export function buildSuspensionLookup(suspensions: ActiveSuspension[]): Record<string, ActiveSuspension> {
  return suspensions.reduce<Record<string, ActiveSuspension>>((acc, suspension) => {
    acc[suspension.playerId] = suspension
    return acc
  }, {})
}

function sortSuspensionsDesc(a: ActiveSuspension, b: ActiveSuspension): number {
  if (a.remainingSeconds !== b.remainingSeconds) {
    return b.remainingSeconds - a.remainingSeconds
  }
  if (a.startSeconds !== b.startSeconds) {
    return b.startSeconds - a.startSeconds
  }
  return a.playerId.localeCompare(b.playerId, undefined, { numeric: true, sensitivity: 'base' })
}

function isSuspensionStartEvent(typeCode: string): boolean {
  return [
    '2min',
    '2_min',
    '2_minutes',
    'two_minutes',
    'two_minute',
    'two_minutes_home',
    'two_minutes_away',
    'exclusao_2min',
    'exclusion_2_min',
    'suspension_2min',
    'suspension_2min_start',
    'suspension_2_min',
    'suspension_2_min_start'
  ].includes(normalizeEventType(typeCode))
}

function normalizeEventType(typeCode: string): string {
  return String(typeCode)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/__+/g, '_')
}
