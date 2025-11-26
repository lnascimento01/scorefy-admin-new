import { getApi } from '@/services/api'
import { MatchControlSnapshot } from '../types'
import { normalizeMatchControlSnapshot } from '../../matches/utils/normalizers'
import type { MatchTimeEvent } from '../hooks/useMatchClock'

const MATCHES_PATH = (process.env.NEXT_PUBLIC_MATCHES_PATH ?? '/v2/auth/matches').replace(/\/$/, '')

async function ensureMatchId(matchId: string | number): Promise<string> {
  const id = String(matchId ?? '').trim()
  if (!id) {
    throw new Error('Match identifier is required.')
  }
  return id
}

function wrapSnapshot(payload: unknown): MatchControlSnapshot | null {
  return normalizeMatchControlSnapshot(payload) ?? null
}

function normalizeInitialClock(payload: unknown): MatchTimeEvent | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const match_id = typeof record.match_id === 'string' ? record.match_id : typeof record.matchId === 'string' ? record.matchId : ''
  const current_seconds =
    typeof record.current_seconds === 'number'
      ? record.current_seconds
      : typeof record.currentSeconds === 'number'
        ? record.currentSeconds
        : Number(record.current_seconds ?? record.currentSeconds)
  const is_running =
    typeof record.is_running === 'boolean'
      ? record.is_running
      : typeof record.isRunning === 'boolean'
        ? record.isRunning
        : Boolean(record.is_running ?? record.isRunning)
  const duration =
    typeof record.duration === 'number'
      ? record.duration
      : Number(record.duration)

  if (!match_id) return null

  return {
    match_id,
    current_seconds: Number.isFinite(current_seconds) ? Number(current_seconds) : 0,
    is_running,
    duration: Number.isFinite(duration) ? Number(duration) : 0
  }
}

export const MatchControlGateway = {
  async fetchState(
    matchId: string | number,
    signal?: AbortSignal
  ): Promise<{ snapshot: MatchControlSnapshot | null; initialClock: MatchTimeEvent | null }> {
    const id = await ensureMatchId(matchId)
    const api = await getApi()
    const { data } = await api.get(`${MATCHES_PATH}/${id}/state`, { signal })
    const raw = (data?.data ?? data) as Record<string, unknown> | undefined
    const snapshot = wrapSnapshot(raw?.snapshot ?? raw)
    const initialClock = normalizeInitialClock(raw?.initialClock ?? raw?.initial_clock)
    return { snapshot, initialClock }
  },

  async start(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'start')
  },

  async pause(matchId: string | number, payload?: { reason: string }): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'pause', payload)
  },

  async resume(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'resume')
  },

  async startSecondHalf(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'second-half')
  },

  async finish(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'finish')
  },

  async endPeriod(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'periods/finalize')
  },

  async cancel(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return this.performAction(matchId, 'cancel')
  },

  async adjustClock(matchId: string | number, deltaSeconds: number): Promise<MatchControlSnapshot | null> {
    const id = await ensureMatchId(matchId)
    const api = await getApi()
    const { data } = await api.post(`${MATCHES_PATH}/${id}/clock/adjust`, { delta_seconds: deltaSeconds })
    return wrapSnapshot(data)
  },

  async performAction(matchId: string | number, action: string, body?: Record<string, unknown>): Promise<MatchControlSnapshot | null> {
    const id = await ensureMatchId(matchId)
    const api = await getApi()
    const { data } = await api.post(`${MATCHES_PATH}/${id}/${action}`, body)
    return wrapSnapshot(data)
  }
}
