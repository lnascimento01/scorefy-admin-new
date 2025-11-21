'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
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
import { formatClock } from '../utils/time'
import { useI18n } from '@/lib/i18n'

export type MatchControlAction = 'start' | 'pause' | 'resume' | 'finish' | 'finishPeriod' | 'cancel'
interface ControlActionPayload {
  reason?: string
}

export function useMatchControl(matchId: string | null) {
  const { dictionary } = useI18n()
  const [detail, setDetail] = useState<MatchControlDetail | null>(null)
  const [snapshot, setSnapshot] = useState<MatchControlSnapshot | null>(null)
  const [events, setEvents] = useState<MatchControlEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [controlLoading, setControlLoading] = useState<MatchControlAction | null>(null)
  const [eventLoading, setEventLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [pendingEvents, setPendingEvents] = useState(0)
  const [networkStatus] = useState<'online' | 'offline'>('online')
  const [timeoutState, setTimeoutState] = useState<{ team: MatchSide; remaining: number } | null>(null)
  const [controlError, setControlError] = useState<string | null>(null)

  const quickActions = useMemo(() => resolveMatchQuickActions(dictionary.matchControl), [dictionary.matchControl])

  const refreshSnapshot = useCallback(async () => {
    if (!matchId) return
    try {
      const state = await MatchControlGateway.fetchState(matchId)
      setSnapshot(state)
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
      const [snapshotResponse, eventList] = await Promise.all([
        MatchControlGateway.fetchState(matchId),
        MatchEventsGateway.list(matchId, {
          homeTeamId: detailResponse.homeTeam.id,
          awayTeamId: detailResponse.awayTeam.id
        })
      ])
      setDetail(detailResponse)
      setSnapshot(snapshotResponse)
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

useEffect(() => {
  if (!matchId) return undefined
  const interval = window.setInterval(() => {
    refreshSnapshot().catch(() => undefined)
    refreshEvents().catch(() => undefined)
  }, 8000)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      refreshSnapshot().catch(() => undefined)
      refreshEvents().catch(() => undefined)
    }
  }
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('focus', handleVisibility)
  return () => {
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('focus', handleVisibility)
  }
}, [matchId, refreshSnapshot, refreshEvents])

  const runControlAction = useCallback(
    async (action: MatchControlAction, payload?: ControlActionPayload) => {
      if (!matchId) return
      setControlLoading(action)
      try {
        let state: MatchControlSnapshot | null = null
        if (action === 'start') {
          state = await MatchControlGateway.start(matchId)
        } else if (action === 'pause') {
          state = await MatchControlGateway.pause(matchId, payload?.reason ? { reason: payload.reason } : undefined)
        } else if (action === 'resume') {
          const currentStatus = snapshot?.status?.toLowerCase()
          if (currentStatus && ['halftime', 'interval'].includes(currentStatus)) {
            state = await MatchControlGateway.startSecondHalf(matchId)
          } else {
            state = await MatchControlGateway.resume(matchId)
          }
        } else if (action === 'finish') {
          state = await MatchControlGateway.finish(matchId)
        } else if (action === 'finishPeriod') {
          state = await MatchControlGateway.endPeriod(matchId)
        } else if (action === 'cancel') {
          state = await MatchControlGateway.cancel(matchId)
        }
        if (state) setSnapshot(state)
        setActionMessage('Status atualizado com sucesso.')
        await refreshEvents()
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to update match status', err)
        }
        const friendlyMessage = resolveControlActionError(err)
        if (friendlyMessage) {
          setControlError(friendlyMessage)
        } else {
          setActionMessage('Falha ao atualizar o status da partida.')
        }
      } finally {
        setControlLoading(null)
      }
    },
    [matchId, refreshEvents, snapshot?.status]
  )

  const adjustClock = useCallback(
    async (targetSeconds: number) => {
      if (!matchId) return
      try {
        const current = snapshot?.elapsedSeconds ?? 0
        const delta = targetSeconds - current
        const state = await MatchControlGateway.adjustClock(matchId, delta)
        if (state) setSnapshot(state)
        setActionMessage('Cronômetro atualizado com sucesso.')
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to adjust clock', err)
        }
        const friendlyMessage = resolveControlActionError(err)
        if (friendlyMessage) {
          setControlError(friendlyMessage)
        } else {
          setActionMessage('Não foi possível atualizar o cronômetro.')
        }
      }
    },
    [matchId, snapshot?.elapsedSeconds]
  )

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

  const clockLabel = useMemo(() => {
    if (!snapshot) return '00:00'
    return formatClock(snapshot.elapsedSeconds ?? 0)
  }, [snapshot])

  return {
    detail,
    snapshot,
    events,
    quickActions,
    loading,
    error,
    actionMessage,
    clearMessage: () => setActionMessage(null),
    controlLoading,
    eventLoading,
    clockLabel,
    runControlAction,
    triggerQuickAction,
    refreshEvents,
    reload: () => loadAll(),
    lastSyncAt,
    pendingEvents,
    networkStatus,
    timeoutState,
    clearTimeout: () => setTimeoutState(null),
    controlError,
    clearControlError: () => setControlError(null),
    adjustClock
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

function resolveControlActionError(error: unknown): string | null {
  if (isAxiosError(error) && error.response?.status === 422) {
    const data = error.response.data as { message?: unknown; errors?: Record<string, unknown> }
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message
    }
    const stateError = data?.errors?.state
    if (Array.isArray(stateError) && typeof stateError[0] === 'string') {
      return stateError[0]
    }
    return 'Ação não permitida no estado atual.'
  }
  return null
}
