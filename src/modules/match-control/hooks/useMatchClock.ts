'use client'

import { useEffect, useRef, useState } from 'react'
import { getEcho } from '@/lib/echo'

interface MatchTimeEvent {
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

export function useMatchClock(matchId: string | number): MatchClockState {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState<number>(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setSeconds(0)
    setIsRunning(false)
    setDuration(0)
    setLastSync(null)
  }, [matchId])

  useEffect(() => {
    const echo = getEcho()
    if (!echo || !matchId) return undefined

    const channelName = `matches.${matchId}`
    const channel = echo.private(channelName)

    const handleEvent = (payload: MatchTimeEvent) => {
      console.log('RECEBI EVENTO MatchTimeUpdated', payload)
      const nextSeconds = Math.max(0, payload.current_seconds ?? 0)
      const nextDuration = Math.max(nextSeconds, payload.duration ?? 0)
      setSeconds(nextSeconds)
      setIsRunning(Boolean(payload.is_running))
      setDuration(nextDuration)
      setLastSync(new Date())
    }

    channel.listen('.MatchTimeUpdated', handleEvent)

    return () => {
      channel.stopListening('.MatchTimeUpdated')
      echo.leave(channelName)
    }
  }, [matchId])

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (!isRunning) return undefined

    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        const limit = duration > 0 ? duration : prev + 1
        const next = prev + 1
        return next > limit ? limit : next
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
