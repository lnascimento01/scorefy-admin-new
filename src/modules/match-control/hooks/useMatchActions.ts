'use client'

import { useCallback, useState } from 'react'
import { getApi } from '@/services/api'

export type MatchControlAction =
  | 'start'
  | 'pause'
  | 'resume'
  | 'finish'
  | 'startNextPeriod'
  | 'cancel'
  | 'adjustTime'

const MATCHES_PATH = (process.env.NEXT_PUBLIC_MATCHES_PATH ?? '/v2/auth/matches').replace(/\/$/, '')

const actionPath: Record<MatchControlAction, string> = {
  start: 'start',
  pause: 'pause',
  resume: 'resume',
  finish: 'finish',
  startNextPeriod: 'second-half',
  cancel: 'cancel',
  adjustTime: 'adjust-time'
}

async function ensureMatchId(matchId: string | number): Promise<string> {
  const id = String(matchId ?? '').trim()
  if (!id) throw new Error('Match id is required')
  return id
}

export function useMatchActions() {
  const [loadingAction, setLoadingAction] = useState<MatchControlAction | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (matchId: string | number, action: MatchControlAction, body?: Record<string, unknown>) => {
    const id = await ensureMatchId(matchId)
    const api = await getApi()
    setLoadingAction(action)
    setError(null)
    setMessage(null)
    try {
      await api.post(`${MATCHES_PATH}/${id}/${actionPath[action]}`, body)
      setMessage('Ação enviada. Aguardando sincronização do relógio.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível executar a ação.')
      throw err
    } finally {
      setLoadingAction(null)
    }
  }, [])

  return {
    loadingAction,
    message,
    error,
    clearMessage: () => setMessage(null),
    clearError: () => setError(null),
    start: (matchId: string | number) => run(matchId, 'start'),
    pause: (matchId: string | number, payload?: { reason?: string }) => run(matchId, 'pause', payload),
    resume: (matchId: string | number) => run(matchId, 'resume'),
    finish: (matchId: string | number) => run(matchId, 'finish'),
    startNextPeriod: (matchId: string | number) => run(matchId, 'startNextPeriod'),
    cancel: (matchId: string | number) => run(matchId, 'cancel'),
    adjustTime: (matchId: string | number, seconds: number) => run(matchId, 'adjustTime', { seconds })
  }
}
