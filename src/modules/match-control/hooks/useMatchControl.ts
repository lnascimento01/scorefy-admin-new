'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { normalizeMatchEvents } from '../utils/normalizers'

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

  const quickActions = useMemo(() => resolveMatchQuickActions(dictionary.matchControl), [dictionary.matchControl])

  const refreshSnapshot = useCallback(async () => {
    if (!matchId) return
    try {
      const state = await MatchControlGateway.fetchState(matchId)
      setSnapshot(state.snapshot)
      setInitialClock(state.initialClock)
      setLastSyncAt(new Date().toISOString())
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to refresh match snapshot', err)
      }
    }
  }, [matchId])

  const loadAll = useCallback(async () => {
    if (!matchId) return
    setLoading(true)
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
      setDetail(detailResponse)
      setSnapshot(stateResponse.snapshot)
      setInitialClock(stateResponse.initialClock)
      setEvents(mergeEvents(detailResponse.events, eventList))
      setLastSyncAt(new Date().toISOString())
      setPendingEvents(0)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to load match control data', err)
      }
      setError('Não foi possível carregar os dados desta partida.')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    loadAll().catch(() => undefined)
  }, [loadAll])

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
      setEvents(mergeEvents(detail.events, eventList))
      setLastSyncAt(new Date().toISOString())
      setPendingEvents(0)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to refresh events', err)
      }
    }
  }, [detail, matchId])

  const triggerQuickAction = useCallback(
    async (action: MatchQuickAction, options: { team: MatchSide; playerId?: string } | null) => {
      if (!matchId || !detail || !options) return
      setEventLoading(true)
      try {
        await MatchEventsGateway.create({
          matchId,
          teamId: options.team === 'home' ? detail.homeTeam.id : detail.awayTeam.id,
          playerId: options.playerId,
          type: action.typeCode,
          matchTimeSeconds: snapshot?.elapsedSeconds
        })
        setActionMessage('Evento registrado com sucesso.')
        await refreshSnapshot()
        if (action.typeCode?.includes('timeout')) {
          setTimeoutState({ team: options.team, remaining: 60 })
        }
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
    [detail, matchId, refreshEvents, refreshSnapshot, snapshot]
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
          setEvents((prev) => mergeEvents(prev, normalized))
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
  }, [matchId, detail?.homeTeam.id, detail?.awayTeam.id])

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
    initialClock
  }
}

function sortEvents(events: MatchControlEvent[]) {
  return [...events].sort((a, b) => {
    const aTime = new Date(a.timestamp).getTime()
    const bTime = new Date(b.timestamp).getTime()
    return bTime - aTime
  })
}

function mergeEvents(staticEvents: MatchControlEvent[], dynamicEvents: MatchControlEvent[]) {
  const combined = [...(staticEvents ?? []), ...(dynamicEvents ?? [])]
  const map = new Map<string, MatchControlEvent>()
  combined.forEach((event) => {
    map.set(event.id, event)
  })
  return sortEvents(Array.from(map.values()))
}
