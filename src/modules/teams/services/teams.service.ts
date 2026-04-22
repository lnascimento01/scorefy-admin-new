import { extractArray } from '@/modules/dashboard/utils/normalizers'
import { getApi } from '@/services/api'
import type { TeamCountry, TeamListMeta, TeamSummary, TeamUpsertPayload } from '../types'

const TEAMS_PATH = (process.env.NEXT_PUBLIC_TEAMS_PATH ?? '/v1/auth/teams').replace(/\/$/, '')
const COUNTRIES_PATH = (process.env.NEXT_PUBLIC_COUNTRIES_PATH ?? '/v1/auth/countries').replace(/\/$/, '')

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

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function normalizeMeta(meta: Record<string, unknown> | undefined): TeamListMeta {
  const currentPage = asNumber(meta?.current_page) ?? asNumber(meta?.currentPage) ?? 1
  const lastPage = asNumber(meta?.last_page) ?? asNumber(meta?.lastPage) ?? currentPage
  const perPage = asNumber(meta?.per_page) ?? asNumber(meta?.perPage) ?? 10
  const total = asNumber(meta?.total) ?? 0
  return { currentPage, lastPage, perPage, total }
}

function normalizeCountry(raw: unknown): TeamCountry | null {
  const item = asObject(raw)
  if (!item) return null

  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null

  return {
    id,
    name,
    code: asString(item.code) ?? undefined,
  }
}

function normalizeColors(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry)).slice(0, 5)
  }

  const item = asObject(raw)
  if (!item) return []

  return Object.values(item)
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 5)
}

function normalizeTeam(item: Record<string, unknown>): TeamSummary | null {
  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null

  return {
    id,
    name,
    shortName: asString(item.short_name ?? item.shortName) ?? undefined,
    slug: asString(item.slug) ?? undefined,
    countryId: asString(item.country_id ?? item.countryId) ?? undefined,
    country: normalizeCountry(item.country),
    city: asString(item.city) ?? undefined,
    colors: normalizeColors(item.colors),
    meta: asObject(item.meta) ?? undefined,
    createdAt: asString(item.created_at ?? item.createdAt) ?? undefined,
    updatedAt: asString(item.updated_at ?? item.updatedAt) ?? undefined,
  }
}

function toApiPayload(payload: TeamUpsertPayload) {
  return {
    name: payload.name,
    short_name: payload.shortName ?? undefined,
    slug: payload.slug ?? undefined,
    country_id: payload.countryId ? Number(payload.countryId) : payload.countryId === null ? null : undefined,
    city: payload.city ?? undefined,
    colors: payload.colors?.length ? payload.colors : payload.colors === null ? null : undefined,
  }
}

export interface TeamListResult {
  items: TeamSummary[]
  meta: TeamListMeta
  source: 'api'
}

export const TeamsGateway = {
  async list(params: {
    page?: number
    perPage?: number
    search?: string
    countryId?: string
    sort?: 'name' | '-name' | 'created_at' | '-created_at'
  } = {}): Promise<TeamListResult> {
    const api = await getApi()
    const { data } = await api.get(TEAMS_PATH, {
      params: {
        page: params.page,
        per_page: params.perPage,
        q: params.search || undefined,
        country_id: params.countryId || undefined,
        sort: params.sort || undefined,
      },
    })

    const payload = (data ?? {}) as Record<string, unknown>
    const items = extractArray(payload.data ?? payload)
      .map((item) => (item && typeof item === 'object' ? normalizeTeam(item as Record<string, unknown>) : null))
      .filter((item): item is TeamSummary => Boolean(item))

    return {
      items,
      meta: normalizeMeta((payload.meta ?? {}) as Record<string, unknown>),
      source: 'api',
    }
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

  async create(payload: TeamUpsertPayload): Promise<TeamSummary> {
    const api = await getApi()
    const { data } = await api.post(TEAMS_PATH, toApiPayload(payload))
    const created = normalizeTeam((data?.data ?? data) as Record<string, unknown>)
    if (!created) {
      throw new Error('Não foi possível criar a equipe.')
    }
    return created
  },

  async update(id: string | number, payload: TeamUpsertPayload): Promise<TeamSummary> {
    const api = await getApi()
    const { data } = await api.patch(`${TEAMS_PATH}/${id}`, toApiPayload(payload))
    const updated = normalizeTeam((data?.data ?? data) as Record<string, unknown>)
    if (!updated) {
      throw new Error('Não foi possível atualizar a equipe.')
    }
    return updated
  },

  async remove(id: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${TEAMS_PATH}/${id}`)
  },

  async listCountries(): Promise<TeamCountry[]> {
    const api = await getApi()
    const { data } = await api.get(COUNTRIES_PATH, {
      params: { per_page: 100, sort: 'name' },
    })
    const payload = (data ?? {}) as Record<string, unknown>
    return extractArray(payload.data ?? payload)
      .map((item) => normalizeCountry(item))
      .filter((item): item is TeamCountry => Boolean(item))
  },
}
