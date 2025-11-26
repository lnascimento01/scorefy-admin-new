import { getApi } from '@/services/api'
import type { MatchControlEvent } from '../types'
import { normalizeMatchEvents } from '../utils/normalizers'

// All event endpoints must target v2 auth matches (do not allow fallback to v1)
const MATCHES_PATH = '/v2/auth/matches'

export interface CreateMatchEventPayload {
  matchId: string | number
  teamId?: string | number
  playerId?: string | number
  type?: string
  typeId?: number
  matchTimeSeconds?: number
}

export const MatchEventsGateway = {
  async list(
    matchId: string | number,
    options?: { homeTeamId?: string | null; awayTeamId?: string | null }
  ): Promise<MatchControlEvent[]> {
    const id = String(matchId ?? '').trim()
    if (!id) throw new Error('Match identifier is required.')
    const api = await getApi()
    const { data } = await api.get(`${MATCHES_PATH}/${id}/events/list`, {
      params: { sort: '-match_time_seconds' }
    })
    const events = Array.isArray(data?.data) ? data.data : data
    return normalizeMatchEvents(events, options?.homeTeamId, options?.awayTeamId)
  },

  async create(payload: CreateMatchEventPayload): Promise<void> {
    const id = String(payload.matchId ?? '').trim()
    if (!id) throw new Error('Match identifier is required.')
    const api = await getApi()
    await api.post(`${MATCHES_PATH}/${id}/events`, {
      match_id: Number(id),
      team_id: payload.teamId !== undefined ? Number(payload.teamId) : undefined,
      player_id: payload.playerId !== undefined ? Number(payload.playerId) : undefined,
      type: payload.type,
      type_id: payload.typeId,
      match_time_seconds: payload.matchTimeSeconds
    })
  }
}
