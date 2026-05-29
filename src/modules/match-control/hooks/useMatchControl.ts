'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MatchesGateway } from '@/modules/matches/services/matches.service'
import type { MatchControlSnapshot } from '@/modules/matches/types'
import { MatchControlGateway } from '../services/match-control.service'
import { MatchEventsGateway } from '../services/match-events.service'
import type {
  MatchControlDetail,
  MatchControlEvent,
  MatchQuickAction,
  MatchSide
} from '../types'
import { resolveMatchQuickActions } from '../utils/quickActions'
import { useI18n } from '@/lib/i18n'
import type { MatchTimeEvent } from './useMatchClock'
import { getEcho } from '@/lib/echo'
import { normalizeMatchEvents, sortMatchControlEvents } from '../utils/normalizers'

export function useMatchControl(matchId: string | null) {
  const { dictionary } = useI18n()
  const [detail, setDetail] = useState<MatchControlDetail | null>(null)
  const [snapshot, setSnapshot] = useState<MatchControlSnapshot | null>(null)
  const [initialClock, setInitialClock] = useState<MatchTimeEvent | null>(null)
  const [events, setEvents] = useState<MatchControlEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [eventLoading, setEventLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [pendingEvents, setPendingEvents] = useState(0)
  const [networkStatus] = useState<'online' | 'offline'>('online')
  const [timeoutState, setTimeoutState] = useState<{ team: MatchSide; remaining: number } | null>(null)
  const appliedGoalEventIdsRef = useRef<Set<string>>(new Set())
  const deletedEventIdsRef = useRef<Set<string>>(new Set())
  const eventsRef = useRef<MatchControlEvent[]>([])

  const quickActions = useMemo(() => resolveMatchQuickActions(dictionary.matchControl), [dictionary.matchControl])
  const suspendedPlayerIds = useMemo(
    () => computeSuspendedPlayerIds(events, snapshot?.elapsedSeconds ?? 0),
    [events, snapshot?.elapsedSeconds]
  )

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  const patchScoreboard = useCallback((homeScore?: number, awayScore?: number) => {
    setDetail((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        homeTeam:
          homeScore !== undefined
            ? { ...prev.homeTeam, score: homeScore }
            : prev.homeTeam,
        awayTeam:
          awayScore !== undefined
            ? { ...prev.awayTeam, score: awayScore }
            : prev.awayTeam
      }
    })
    setSnapshot((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        home:
          homeScore !== undefined
            ? { ...prev.home, score: homeScore }
            : prev.home,
        away:
          awayScore !== undefined
            ? { ...prev.away, score: awayScore }
            : prev.away
      }
    })
  }, [])

  const syncGoalEventIds = useCallback((nextEvents: MatchControlEvent[]) => {
    appliedGoalEventIdsRef.current = new Set(
      nextEvents.filter((event) => isGoalEvent(event.typeCode)).map((event) => event.id)
    )
  }, [])

  const reconcileScoreboardFromEvents = useCallback((nextEvents: MatchControlEvent[]) => {
    const { home, away } = deriveScoreboardFromEvents(nextEvents)
    patchScoreboard(home, away)
  }, [patchScoreboard])

  const reconcileServerEvents = useCallback((serverEvents: MatchControlEvent[]) => {
    const serverIds = new Set(serverEvents.map((event) => event.id))
    deletedEventIdsRef.current.forEach((eventId) => {
      if (!serverIds.has(eventId)) {
        deletedEventIdsRef.current.delete(eventId)
      }
    })

    const mergedEvents = mergeEvents(eventsRef.current, serverEvents)
      .filter((event) => !deletedEventIdsRef.current.has(event.id))

    eventsRef.current = mergedEvents
    setEvents(mergedEvents)
    syncGoalEventIds(mergedEvents)
    reconcileScoreboardFromEvents(mergedEvents)
    return mergedEvents
  }, [reconcileScoreboardFromEvents, syncGoalEventIds])

  const upsertEvent = useCallback((incoming: MatchControlEvent) => {
    deletedEventIdsRef.current.delete(incoming.id)
    const nextEvents = mergeEvents(eventsRef.current, [incoming])
    eventsRef.current = nextEvents
    setEvents(nextEvents)
    setDetail((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        events: nextEvents
      }
    })
    const nextScores = deriveScoreboardFromEvents(nextEvents)
    patchScoreboard(nextScores.home, nextScores.away)
    if (isGoalEvent(incoming.typeCode)) {
      appliedGoalEventIdsRef.current.add(incoming.id)
    }
    syncGoalEventIds(nextEvents)
    reconcileScoreboardFromEvents(nextEvents)
  }, [patchScoreboard, reconcileScoreboardFromEvents, syncGoalEventIds])

  const refreshSnapshot = useCallback(async () => {
    if (!matchId) return
    try {
      const state = await MatchControlGateway.fetchState(matchId)
      setSnapshot(state.snapshot)
      setInitialClock(state.initialClock)
      reconcileScoreboardFromEvents(eventsRef.current)
      setLastSyncAt(new Date().toISOString())
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to refresh match snapshot', err)
      }
    }
  }, [matchId, reconcileScoreboardFromEvents])

  const loadAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!matchId) return
    if (!options?.silent) {
      setLoading(true)
    }
    setError(null)
    try {
      const detailResponse = await MatchesGateway.getById(matchId)
      const [stateResponse, eventList] = await Promise.all([
        MatchControlGateway.fetchState(matchId),
        MatchEventsGateway.list(matchId, {
          homeTeamId: detailResponse.homeTeam.id,
          awayTeamId: detailResponse.awayTeam.id
        })
      ])
      const serverEvents = mergeEvents(detailResponse.events, eventList)
      const mergedEvents = reconcileServerEvents(serverEvents)
      setDetail((prev) => {
        const source = detailResponse ?? prev
        if (!source) return prev
        const nextScores = deriveScoreboardFromEvents(mergedEvents)
        return {
          ...source,
          homeTeam: { ...source.homeTeam, score: nextScores.home },
          awayTeam: { ...source.awayTeam, score: nextScores.away },
          events: mergedEvents
        }
      })
      setSnapshot((prev) => {
        const source = stateResponse.snapshot ?? prev
        if (!source) return prev
        const nextScores = deriveScoreboardFromEvents(mergedEvents)
        return {
          ...source,
          home: { ...source.home, score: nextScores.home },
          away: { ...source.away, score: nextScores.away }
        }
      })
      setInitialClock(stateResponse.initialClock)
      setLastSyncAt(new Date().toISOString())
      setPendingEvents(0)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to load match control data', err)
      }
      setError('Não foi possível carregar os dados desta partida.')
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [matchId, reconcileServerEvents])

  useEffect(() => {
    loadAll().catch(() => undefined)
  }, [loadAll])

  useEffect(() => {
    setTimeoutState(deriveTimeoutState(snapshot, events))
  }, [events, snapshot])

  useEffect(() => {
    if (!timeoutState) return undefined
    if (timeoutState.remaining <= 0) {
      setTimeoutState(null)
      return undefined
    }
    const interval = window.setInterval(() => {
      setTimeoutState((prev) => {
        if (!prev) return null
        if (prev.remaining <= 1) {
          return null
        }
        return { ...prev, remaining: prev.remaining - 1 }
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timeoutState])

  const refreshEvents = useCallback(async () => {
    if (!matchId || !detail) return
    try {
      const eventList = await MatchEventsGateway.list(matchId, {
        homeTeamId: detail.homeTeam.id,
        awayTeamId: detail.awayTeam.id
      })
      const mergedEvents = reconcileServerEvents(eventList)
      setDetail((prev) => {
        if (!prev) return prev
        const nextScores = deriveScoreboardFromEvents(mergedEvents)
        return {
          ...prev,
          events: mergedEvents,
          homeTeam: { ...prev.homeTeam, score: nextScores.home },
          awayTeam: { ...prev.awayTeam, score: nextScores.away }
        }
      })
      reconcileScoreboardFromEvents(mergedEvents)
      setLastSyncAt(new Date().toISOString())
      setPendingEvents(0)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to refresh events', err)
      }
    }
  }, [detail, matchId, reconcileServerEvents, reconcileScoreboardFromEvents])

  const triggerQuickAction = useCallback(
    async (action: MatchQuickAction, options: { team: MatchSide; playerId?: string } | null) => {
      if (!matchId || !detail || !options) return
      setEventLoading(true)
      try {
        if (isTimeoutQuickAction(action.typeCode)) {
          const timeoutResult = await MatchControlGateway.registerTimeout(
            matchId,
            {
              teamId: options.team === 'home' ? detail.homeTeam.id : detail.awayTeam.id,
              type: '30S'
            },
            {
              homeTeamId: detail.homeTeam.id,
              awayTeamId: detail.awayTeam.id
            }
          )

          if (timeoutResult.timeoutEvent) {
            upsertEvent(timeoutResult.timeoutEvent)
          }
          if (timeoutResult.snapshot) {
            setSnapshot(timeoutResult.snapshot)
            setLastSyncAt(new Date().toISOString())
          }
          setActionMessage('Evento registrado com sucesso.')
          await refreshEvents()
          return
        }

        const createdEvent = await MatchEventsGateway.create(
          {
            matchId,
            teamId: options.team === 'home' ? detail.homeTeam.id : detail.awayTeam.id,
            playerId: options.playerId,
            type: action.typeCode,
            matchTimeSeconds: snapshot?.elapsedSeconds
          },
          {
            homeTeamId: detail.homeTeam.id,
            awayTeamId: detail.awayTeam.id
          }
        )
        if (createdEvent) {
          upsertEvent(createdEvent)
        }
        setActionMessage('Evento registrado com sucesso.')
        await refreshSnapshot()
        await refreshEvents()
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to register event', err)
        }
        setActionMessage('Não foi possível registrar o evento.')
      } finally {
        setEventLoading(false)
      }
    },
    [detail, matchId, refreshEvents, refreshSnapshot, snapshot?.elapsedSeconds, upsertEvent]
  )

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!matchId || !detail) return
      setEventLoading(true)
      try {
        const targetEvent = events.find((event) => event.id === eventId) ?? null
        await MatchEventsGateway.delete(matchId, eventId)
        deletedEventIdsRef.current.add(eventId)
        const nextEvents = eventsRef.current.filter((event) => event.id !== eventId)
        eventsRef.current = nextEvents
        setEvents(nextEvents)
        setDetail((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            events: prev.events.filter((event) => event.id !== eventId)
          }
        })
        if (targetEvent && isGoalEvent(targetEvent.typeCode)) {
          appliedGoalEventIdsRef.current.delete(targetEvent.id)
        }
        syncGoalEventIds(nextEvents)
        reconcileScoreboardFromEvents(nextEvents)
        setActionMessage('Evento removido com sucesso.')
        await loadAll({ silent: true })
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to delete event', err)
        }
        setActionMessage('Não foi possível remover o evento.')
      } finally {
        setEventLoading(false)
      }
    },
    [detail, loadAll, matchId, reconcileScoreboardFromEvents, syncGoalEventIds]
  )

  useEffect(() => {
    if (!matchId) return undefined
    let cancelled = false
    let channel: ReturnType<NonNullable<Awaited<ReturnType<typeof getEcho>>>['private']> | null = null

    const subscribe = async () => {
      try {
        const echo = await getEcho()
        if (!echo || cancelled) return

        const channelName = `matches.${matchId}`
        channel = echo.private(channelName)
        channel.listen('.MatchEventCreated', (event: unknown) => {
          const normalized = normalizeMatchEvents(
            Array.isArray(event) ? event : [event],
            detail?.homeTeam.id,
            detail?.awayTeam.id
          )
          if (!normalized.length) return
          upsertEvent(normalized[0])
          void refreshEvents()
        })
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to subscribe to MatchEventCreated', error)
        }
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (channel) {
        channel.stopListening('.MatchEventCreated')
      }
    }
  }, [detail?.homeTeam.id, detail?.awayTeam.id, matchId, refreshEvents, upsertEvent])

  return {
    detail,
    snapshot,
    events,
    quickActions,
    loading,
    error,
    actionMessage,
    clearMessage: () => setActionMessage(null),
    eventLoading,
    triggerQuickAction,
    refreshEvents,
    reload: () => loadAll(),
    lastSyncAt,
    pendingEvents,
    networkStatus,
    timeoutState,
    clearTimeout: () => setTimeoutState(null),
    initialClock,
    deleteEvent,
    suspendedPlayerIds
  }
}

function sortEvents(events: MatchControlEvent[]) {
  return sortMatchControlEvents(events)
}

function mergeEvents(staticEvents: MatchControlEvent[], dynamicEvents: MatchControlEvent[]) {
  const combined = [...(staticEvents ?? []), ...(dynamicEvents ?? [])]
  const map = new Map<string, MatchControlEvent>()
  combined.forEach((event) => {
    map.set(event.id, event)
  })
  return sortEvents(Array.from(map.values()))
}

function deriveScoreboardFromEvents(events: MatchControlEvent[]) {
  return events.reduce(
    (acc, event) => {
      if (!isGoalEvent(event.typeCode)) return acc
      if (event.team === 'home') {
        acc.home += 1
      } else if (event.team === 'away') {
        acc.away += 1
      }
      return acc
    },
    { home: 0, away: 0 }
  )
}

function deriveTimeoutState(
  snapshot: MatchControlSnapshot | null,
  events: MatchControlEvent[]
): { team: MatchSide; remaining: number } | null {
  if (!snapshot || snapshot.status !== 'paused') {
    return null
  }

  const meta = snapshot.meta ?? {}
  const timeoutUntil = readString(meta.timeout_until ?? meta.timeoutUntil)
  if (!timeoutUntil) {
    return null
  }

  const expiresAt = Date.parse(timeoutUntil)
  if (!Number.isFinite(expiresAt)) {
    return null
  }

  const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
  if (remaining <= 0) {
    return null
  }

  const timeoutEvent = [...events].find((event) => isTimeoutEvent(event.typeCode))
  if (!timeoutEvent?.team) {
    return null
  }

  return {
    team: timeoutEvent.team,
    remaining
  }
}

function computeSuspendedPlayerIds(events: MatchControlEvent[], currentSeconds: number): Set<string> {
  const suspended = new Set<string>()
  const grouped = new Map<string, MatchControlEvent[]>()

  events.forEach((event) => {
    if (!event.playerId || !event.typeCode) return
    const type = normalizeEventType(event.typeCode)
    if (!isSuspensionStartEvent(type) && !isSuspensionEndEvent(type)) return
    const bucket = grouped.get(event.playerId) ?? []
    bucket.push(event)
    grouped.set(event.playerId, bucket)
  })

  grouped.forEach((playerEvents, playerId) => {
    const sorted = [...playerEvents].sort((a, b) => {
      const aSeconds = typeof a.matchTimeSeconds === 'number' ? a.matchTimeSeconds : -1
      const bSeconds = typeof b.matchTimeSeconds === 'number' ? b.matchTimeSeconds : -1
      if (aSeconds !== bSeconds) {
        return aSeconds - bSeconds
      }

      return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    })

    let activeUntil: number | null = null
    sorted.forEach((event) => {
      const type = normalizeEventType(event.typeCode)
      const matchSeconds = typeof event.matchTimeSeconds === 'number' ? event.matchTimeSeconds : 0
      if (isSuspensionStartEvent(type)) {
        activeUntil = matchSeconds + 120
      } else if (isSuspensionEndEvent(type)) {
        activeUntil = null
      }
    })

    if (activeUntil !== null && currentSeconds < activeUntil) {
      suspended.add(playerId)
    }
  })

  return suspended
}

function isTimeoutEvent(typeCode?: string): boolean {
  if (!typeCode) return false
  const normalized = normalizeEventType(typeCode)
  return normalized.includes('timeout')
}

function isTimeoutQuickAction(typeCode?: string): boolean {
  if (!typeCode) return false
  return isTimeoutEvent(typeCode)
}

function isSuspensionStartEvent(typeCode: string): boolean {
  return [
    '2min',
    'exclusao_2min',
    'suspension_2min',
    'suspension_2min_start',
  ].includes(normalizeEventType(typeCode))
}

function isSuspensionEndEvent(typeCode: string): boolean {
  return [
    'suspension_2min_end',
    '2min_end',
    'exclusao_2min_end',
  ].includes(normalizeEventType(typeCode))
}

function normalizeEventType(typeCode: string): string {
  return String(typeCode)
    .trim()
    .toLowerCase()
    .replace(/-/g, '_')
}

function isGoalEvent(typeCode?: string): boolean {
  if (!typeCode) return false
  return normalizeEventType(typeCode).includes('goal')
}

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  return null
}
