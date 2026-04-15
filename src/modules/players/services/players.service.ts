import { extractArray } from '@/modules/dashboard/utils/normalizers'
import { getApi } from '@/services/api'
import type {
  PlayerCatalogOption,
  PlayerListMeta,
  PlayerListParams,
  PlayerListResult,
  PlayerSummary,
  PlayerTransferPayload,
  PlayerUpsertPayload,
} from '../types'

const PLAYERS_PATH = (process.env.NEXT_PUBLIC_PLAYERS_PATH ?? '/v1/auth/players').replace(/\/$/, '')
const TEAMS_PATH = (process.env.NEXT_PUBLIC_TEAMS_PATH ?? '/v1/auth/teams').replace(/\/$/, '')
const PLAYER_POSITIONS_PATH = (process.env.NEXT_PUBLIC_PLAYER_POSITIONS_PATH ?? '/v1/auth/player-positions').replace(/\/$/, '')

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null
  if (typeof value === 'string') {
    if (value === 'true' || value === '1') return true
    if (value === 'false' || value === '0') return false
  }
  return null
}

function normalizeMeta(meta: Record<string, unknown> | undefined): PlayerListMeta {
  const currentPage = asNumber(meta?.current_page ?? meta?.currentPage) ?? 1
  const lastPage = asNumber(meta?.last_page ?? meta?.lastPage) ?? currentPage
  const perPage = asNumber(meta?.per_page ?? meta?.perPage) ?? 10
  const total = asNumber(meta?.total) ?? 0
  return { currentPage, lastPage, perPage, total }
}

function normalizeTeamOption(item: Record<string, unknown>): PlayerCatalogOption | null {
  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null

  const shortName = asString(item.short_name ?? item.shortName)
  return {
    id,
    label: name,
    secondaryLabel: shortName ?? undefined,
  }
}

function normalizePositionOption(item: Record<string, unknown>): PlayerCatalogOption | null {
  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null

  return {
    id,
    label: name,
    secondaryLabel: asString(item.code) ?? undefined,
  }
}

function normalizePlayer(item: Record<string, unknown>): PlayerSummary | null {
  const id = asString(item.id)
  const firstName = asString(item.first_name ?? item.firstName)
  const lastName = asString(item.last_name ?? item.lastName)
  const fullName = asString(item.full_name ?? item.fullName)

  if (!id || !firstName || !lastName || !fullName) return null

  const rawTeam = item.team && typeof item.team === 'object' ? (item.team as Record<string, unknown>) : null
  const rawPosition = item.position && typeof item.position === 'object' ? (item.position as Record<string, unknown>) : null

  return {
    id,
    teamId: asString(item.team_id ?? item.teamId) ?? undefined,
    team: rawTeam
      ? {
          id: asString(rawTeam.id) ?? '',
          name: asString(rawTeam.name) ?? 'Equipe',
          shortName: asString(rawTeam.short_name ?? rawTeam.shortName) ?? undefined,
        }
      : null,
    positionId: asString(item.position_id ?? item.positionId) ?? undefined,
    position: rawPosition
      ? {
          id: asString(rawPosition.id) ?? '',
          name: asString(rawPosition.name) ?? 'Posição',
          code: asString(rawPosition.code) ?? undefined,
        }
      : null,
    firstName,
    lastName,
    nickname: asString(item.nickname) ?? undefined,
    fullName,
    birthdate: asString(item.birthdate) ?? undefined,
    number: asNumber(item.number),
    nationality: asString(item.nationality) ?? undefined,
    isActive: asBoolean(item.is_active ?? item.isActive) ?? false,
    meta: item.meta ?? {},
    createdAt: asString(item.created_at ?? item.createdAt) ?? undefined,
    updatedAt: asString(item.updated_at ?? item.updatedAt) ?? undefined,
  }
}

function normalizePlayerPayload(payload: unknown): PlayerSummary {
  const detail = normalizePlayer((payload ?? {}) as Record<string, unknown>)
  if (!detail) {
    throw new Error('Não foi possível normalizar o atleta retornado pela API.')
  }
  return detail
}

export const PlayersGateway = {
  async list(params: PlayerListParams = {}): Promise<PlayerListResult> {
    const api = await getApi()
    const { data } = await api.get(PLAYERS_PATH, {
      params: {
        q: params.q,
        team_id: params.teamId,
        is_active: params.isActive,
        page: params.page,
        per_page: params.perPage,
      },
    })

    const payload = (data ?? {}) as Record<string, unknown>
    const items = extractArray(payload.data ?? payload)
      .map((item) => (item && typeof item === 'object' ? normalizePlayer(item as Record<string, unknown>) : null))
      .filter((item): item is PlayerSummary => Boolean(item))

    return {
      items,
      meta: normalizeMeta((payload.meta ?? {}) as Record<string, unknown>),
      source: 'api',
    }
  },

  async getById(id: string | number): Promise<PlayerSummary> {
    const api = await getApi()
    const { data } = await api.get(`${PLAYERS_PATH}/${id}`)
    return normalizePlayerPayload(data?.data ?? data)
  },

  async create(payload: PlayerUpsertPayload): Promise<PlayerSummary> {
    const api = await getApi()
    const { data } = await api.post(PLAYERS_PATH, {
      team_id: payload.teamId,
      position_id: payload.positionId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      nickname: payload.nickname,
      birthdate: payload.birthdate,
      number: payload.number,
      nationality: payload.nationality,
      is_active: payload.isActive,
      meta: payload.meta,
    })
    return normalizePlayerPayload(data?.data ?? data)
  },

  async update(id: string | number, payload: PlayerUpsertPayload): Promise<PlayerSummary> {
    const api = await getApi()
    const { data } = await api.patch(`${PLAYERS_PATH}/${id}`, {
      position_id: payload.positionId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      nickname: payload.nickname,
      birthdate: payload.birthdate,
      number: payload.number,
      nationality: payload.nationality,
      is_active: payload.isActive,
      meta: payload.meta,
    })
    return normalizePlayerPayload(data?.data ?? data)
  },

  async transfer(id: string | number, payload: PlayerTransferPayload): Promise<PlayerSummary> {
    const api = await getApi()
    const { data } = await api.post(`${PLAYERS_PATH}/${id}/transfer`, {
      team_id: payload.teamId,
    })
    return normalizePlayerPayload(data?.data ?? data)
  },

  async remove(id: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${PLAYERS_PATH}/${id}`)
  },

  async listTeams(query = ''): Promise<PlayerCatalogOption[]> {
    const api = await getApi()
    const { data } = await api.get(TEAMS_PATH, {
      params: {
        q: query || undefined,
        per_page: 100,
        sort: 'name',
      },
    })

    return extractArray((data ?? {}) as Record<string, unknown>)
      .map((item) => (item && typeof item === 'object' ? normalizeTeamOption(item as Record<string, unknown>) : null))
      .filter((item): item is PlayerCatalogOption => Boolean(item))
  },

  async listPositions(query = ''): Promise<PlayerCatalogOption[]> {
    const api = await getApi()
    const { data } = await api.get(PLAYER_POSITIONS_PATH, {
      params: {
        q: query || undefined,
        per_page: 100,
        sort: 'code',
      },
    })

    return extractArray((data ?? {}) as Record<string, unknown>)
      .map((item) => (item && typeof item === 'object' ? normalizePositionOption(item as Record<string, unknown>) : null))
      .filter((item): item is PlayerCatalogOption => Boolean(item))
  },
}
