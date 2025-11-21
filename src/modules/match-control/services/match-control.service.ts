import { getApi } from '@/services/api'
import { MatchControlSnapshot } from '../types'
import { normalizeMatchControlSnapshot } from '../../matches/utils/normalizers'

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

export const MatchControlGateway = {
  async fetchState(matchId: string | number, signal?: AbortSignal): Promise<MatchControlSnapshot | null> {
    const id = await ensureMatchId(matchId)
    const api = await getApi()
    const { data } = await api.get(`${MATCHES_PATH}/${id}/state`, { signal })
    return wrapSnapshot(data)
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
