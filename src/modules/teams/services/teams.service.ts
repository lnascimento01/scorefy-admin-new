import { getApi } from '@/services/api'
import { extractArray } from '@/modules/dashboard/utils/normalizers'
import type { TeamListMeta, TeamStatus, TeamSummary } from '../types'

const TEAMS_PATH = (process.env.NEXT_PUBLIC_TEAMS_PATH ?? '/v1/auth/teams').replace(/\/$/, '')

function asString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function normalizeMeta(meta: Record<string, unknown> | undefined): TeamListMeta {
  const currentPage = asNumber(meta?.current_page) ?? asNumber(meta?.currentPage) ?? 1
  const lastPage = asNumber(meta?.last_page) ?? asNumber(meta?.lastPage) ?? currentPage
  const perPage = asNumber(meta?.per_page) ?? asNumber(meta?.perPage) ?? 10
  const total = asNumber(meta?.total) ?? 0
  return { currentPage, lastPage, perPage, total }
}

function normalizeTeam(item: Record<string, unknown>): TeamSummary | null {
  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null
  const shortName = asString(item.short_name ?? item.shortName) ?? undefined
  const city = asString(item.city) ?? undefined
  const state = asString(item.state) ?? undefined
  const country = asString(item.country) ?? undefined
  const category = asString(item.category) ?? undefined
  const gender = asString(item.gender) ?? undefined
  const coach = asString(item.coach) ?? undefined
  const totalPlayers = asNumber(item.total_players ?? item.totalPlayers) ?? undefined
  const updatedAt = asString(item.updated_at ?? item.updatedAt) ?? undefined
  const foundedAt = asString(item.founded_at ?? item.foundedAt) ?? undefined
  const status = (asString(item.status) as TeamStatus) ?? 'active'

  return {
    id,
    name,
    shortName,
    city,
    state,
    country,
    category,
    gender,
    coach,
    totalPlayers,
    updatedAt,
    foundedAt,
    status
  }
}

export interface TeamListResult {
  items: TeamSummary[]
  meta: TeamListMeta
  error?: string
  source: 'api' | 'mock'
}

export const TeamsGateway = {
  async list(params: { page?: number; perPage?: number; search?: string; status?: TeamStatus | 'all'; category?: string; gender?: string } = {}): Promise<TeamListResult> {
    const api = await getApi()
    const { data } = await api.get(TEAMS_PATH, {
      params: {
        page: params.page,
        per_page: params.perPage,
        search: params.search,
        status: params.status && params.status !== 'all' ? params.status : undefined,
        category: params.category,
        gender: params.gender
      }
    })
    const payload = data ?? data?.data
    const candidates = extractArray(payload?.data ?? payload?.teams ?? payload)
    const items = candidates
      .map((item) => (item && typeof item === 'object' ? normalizeTeam(item as Record<string, unknown>) : null))
      .filter((item): item is TeamSummary => Boolean(item))
    const meta = normalizeMeta((payload?.meta ?? {}) as Record<string, unknown>)
    return { items, meta, source: 'api' }
  },

  async getById(id: string | number): Promise<TeamSummary> {
    const api = await getApi()
    const { data } = await api.get(`${TEAMS_PATH}/${id}`)
    const detail = normalizeTeam((data?.data ?? data) as Record<string, unknown>)
    if (!detail) {
      throw new Error('Equipe não encontrada.')
    }
    return detail
  },

  async update(id: string | number, payload: Partial<TeamSummary>): Promise<TeamSummary> {
    const api = await getApi()
    const { data } = await api.patch(`${TEAMS_PATH}/${id}`, {
      name: payload.name,
      short_name: payload.shortName,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      category: payload.category,
      gender: payload.gender,
      coach: payload.coach,
      status: payload.status,
      total_players: payload.totalPlayers,
      founded_at: payload.foundedAt
    })
    const detail = normalizeTeam((data?.data ?? data) as Record<string, unknown>)
    if (!detail) {
      throw new Error('Não foi possível atualizar equipe.')
    }
    return detail
  },

  async remove(id: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${TEAMS_PATH}/${id}`)
  }
}
