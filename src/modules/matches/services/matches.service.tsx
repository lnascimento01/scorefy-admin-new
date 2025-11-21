import { getApi } from '@/services/api'
import {
  MatchControlSnapshot,
  MatchCreatePayload,
  MatchListFilters,
  MatchListMeta,
  MatchListResult,
  MatchUpdatePayload,
  MatchUpdatePlayersPayload
} from '../types'
import { extractArray } from '../../dashboard/utils/normalizers'
import { normalizeMatchSummary } from '../utils/normalizers'
import { MatchControlGateway } from '../../match-control/services/match-control.service'
import type { MatchControlDetail } from '../../match-control/types'
import { normalizeMatchDetail } from '../../match-control/utils/normalizers'

const MATCHES_PATH = (process.env.NEXT_PUBLIC_MATCHES_PATH ?? '/v1/auth/matches').replace(/\/$/, '')

function normalizeMeta(meta: Record<string, unknown> | undefined): MatchListMeta {
  const currentPage = typeof meta?.current_page === 'number' ? meta.current_page : Number(meta?.current_page) || 1
  const lastPage = typeof meta?.last_page === 'number' ? meta.last_page : Number(meta?.last_page) || 1
  const perPage = typeof meta?.per_page === 'number' ? meta.per_page : Number(meta?.per_page) || 10
  const total = typeof meta?.total === 'number' ? meta.total : Number(meta?.total) || 0
  return { currentPage, lastPage, perPage, total }
}

function buildQuery(filters: MatchListFilters) {
  const query: Record<string, string | number> = {
    per_page: filters.perPage ?? 10,
    page: filters.page ?? 1,
    include: 'competition,competition.config'
  }
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status
  }
  if (filters.competitionId && filters.competitionId !== 'all') {
    query.competition_id = filters.competitionId
  }
  if (filters.date) {
    query.from = filters.date
    query.to = filters.date
  }
  if (filters.search) {
    query.search = filters.search
  }
  return query
}

export const MatchesGateway = {
  async list(filters: MatchListFilters = {}): Promise<MatchListResult> {
    const api = await getApi()
    const { data } = await api.get(MATCHES_PATH, {
      params: buildQuery(filters)
    })

    const rawItems = extractArray(data?.data) || extractArray(data)
    const normalized = rawItems
      .map((item) => normalizeMatchSummary(item))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    const meta = normalizeMeta((data?.meta ?? {}) as Record<string, unknown>)

    return {
      data: normalized,
      meta,
      errorMessage: data?.error ?? undefined,
      lastSync: new Date().toISOString()
    }
  },

  async start(matchId: string | number): Promise<MatchControlSnapshot | null> {
    return MatchControlGateway.start(matchId)
  },

  async create(payload: MatchCreatePayload): Promise<MatchControlDetail> {
    const api = await getApi()
    const { data } = await api.post(MATCHES_PATH, {
      competition_id: payload.competitionId,
      home_team_id: payload.homeTeamId,
      away_team_id: payload.awayTeamId,
      start_at: payload.startAt,
      venue_id: payload.venueId || undefined
    })
    const detail = normalizeMatchDetail(data?.data ?? data)
    if (!detail) {
      throw new Error('Não foi possível criar a partida.')
    }
    return detail
  },

  async updatePlayers(matchId: string | number, payload: MatchUpdatePlayersPayload): Promise<MatchControlDetail> {
    const id = String(matchId ?? '').trim()
    if (!id) throw new Error('Match identifier is required.')
    if (!payload.addPlayerIds?.length && !payload.removePlayerIds?.length) {
      throw new Error('Selecione pelo menos um jogador para adicionar ou remover.')
    }
    const api = await getApi()
    const { data } = await api.patch(`${MATCHES_PATH}/${id}/players`, {
      ...(payload.addPlayerIds?.length ? { add_player_ids: payload.addPlayerIds } : {}),
      ...(payload.removePlayerIds?.length ? { remove_player_ids: payload.removePlayerIds } : {})
    })
    const detail = normalizeMatchDetail(data?.data ?? data)
    if (!detail) {
      throw new Error('Não foi possível atualizar o elenco.')
    }
    return detail
  },

  async update(matchId: string | number, payload: MatchUpdatePayload): Promise<MatchControlDetail> {
    const id = String(matchId ?? '').trim()
    if (!id) throw new Error('Match identifier is required.')
    const api = await getApi()
    const { data } = await api.patch(`${MATCHES_PATH}/${id}`, {
      ...(payload.competitionId ? { competition_id: payload.competitionId } : {}),
      ...(payload.homeTeamId ? { home_team_id: payload.homeTeamId } : {}),
      ...(payload.awayTeamId ? { away_team_id: payload.awayTeamId } : {}),
      ...(payload.startAt ? { start_at: payload.startAt } : {}),
      ...(payload.venueId !== undefined ? { venue_id: payload.venueId || null } : {})
    })
    const detail = normalizeMatchDetail(data?.data ?? data)
    if (!detail) {
      throw new Error('Não foi possível atualizar a partida.')
    }
    return detail
  },

  async getById(matchId: string | number): Promise<MatchControlDetail> {
    const id = String(matchId ?? '').trim()
    if (!id) {
      throw new Error('Match identifier is required.')
    }
    const api = await getApi()
    const { data } = await api.get(`${MATCHES_PATH}/${id}`, {
      params: {
        include:
          'competition,venue,home_team,away_team,events.team,events.player,players,players.team'
      }
    })
    const payload = data?.data ?? data
    const detail = normalizeMatchDetail(payload)
    if (!detail) {
      throw new Error('Partida não encontrada.')
    }
    return detail
  }
}
