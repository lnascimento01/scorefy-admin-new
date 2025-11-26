'use client'

import type Echo from 'laravel-echo'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getEcho } from '@/lib/echo'
import type { MatchControlSnapshot } from '@/modules/matches/types'

export interface MatchTimeEvent {
  match_id: string
  current_seconds: number
  is_running: boolean
  duration: number
}

export interface MatchClockState {
  seconds: number
  isRunning: boolean
  lastSync: Date | null
  duration: number
}

const RUNNING_STATUSES = ['live', 'in_progress', 'started']
const PERIOD_LENGTH_DEFAULT = 1800

export function useMatchClock(
  id: string | number,
  initialSnapshot?: MatchControlSnapshot | null
): MatchClockState {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState<number>(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const timerRef = useRef<number | null>(null)
  const channelRef = useRef<{ name: string; echo: Echo } | null>(null)

  const handleUpdate = useCallback((payload: MatchTimeEvent) => {
    const periodLength = duration > 0 ? duration : PERIOD_LENGTH_DEFAULT
    const aggregatedSeconds = Math.max(0, payload.current_seconds ?? 0)
    const nextSeconds = aggregatedSeconds % periodLength
    const nextDuration = Math.max(periodLength, nextSeconds)
    setSeconds(nextSeconds)
    setIsRunning(Boolean(payload.is_running))
    setDuration(nextDuration)
    setLastSync(new Date())
  }, [])

  useEffect(() => {
    if (initialSnapshot) return

    // reset padrão para nova partida sem estado inicial
    setSeconds(0)
    setIsRunning(false)
    setDuration(0)
    setLastSync(null)
  }, [id, initialSnapshot]) // nenhuma outra dependência

  useEffect(() => {
    if (!initialSnapshot) return

    const initialSeconds =
      typeof (initialSnapshot as Record<string, unknown>)?.elapsed_seconds === 'number'
        ? Number((initialSnapshot as Record<string, unknown>).elapsed_seconds)
        : Number((initialSnapshot as Record<string, unknown>)?.elapsedSeconds ?? 0)

    const statusRaw = (initialSnapshot as Record<string, unknown>)?.status
    const status = typeof statusRaw === 'string' ? statusRaw.toLowerCase() : ''
    const running = RUNNING_STATUSES.includes(status)

    const maxPeriodSecondsRaw =
      (initialSnapshot as Record<string, unknown>)?.MAX_PERIOD_SECONDS ??
      (initialSnapshot as Record<string, unknown>)?.max_period_seconds ??
      (initialSnapshot as Record<string, unknown>)?.maxPeriodSeconds
    const maxPeriodSeconds = Number(maxPeriodSecondsRaw)
    const periodLength =
      Number.isFinite(maxPeriodSeconds) && maxPeriodSeconds > 0
        ? Number(maxPeriodSeconds)
        : PERIOD_LENGTH_DEFAULT

    const displaySeconds = Math.max(0, Number.isFinite(initialSeconds) ? initialSeconds % periodLength : 0)

    setSeconds(displaySeconds)
    setIsRunning(running)
    setDuration(periodLength)
    setLastSync(new Date())
  }, [initialSnapshot])

  useEffect(() => {
    const channelName = `matches.${id}`
    let cancelled = false

    const subscribe = async () => {
      try {
        const instance = await getEcho()
        if (cancelled) return

        if (channelRef.current?.name === channelName) return

        if (channelRef.current) {
          channelRef.current.echo.leave(channelRef.current.name)
          channelRef.current = null
        }

        const channel = instance.private(channelName)
        channel.listen('.MatchTimeUpdated', handleUpdate)
        channelRef.current = { name: channelName, echo: instance }
      } catch (error) {
        console.error('[match-clock] Falha ao conectar no Echo', error)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      if (channelRef.current) {
        channelRef.current.echo.leave(channelRef.current.name)
        channelRef.current = null
      }
    }
  }, [id, handleUpdate])

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (!isRunning) return undefined

    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1
        if (duration > 0) {
          return Math.min(next, duration)
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, duration])

  return { seconds, isRunning, lastSync, duration }
}
