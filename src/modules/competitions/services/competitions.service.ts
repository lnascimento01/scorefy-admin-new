import { getApi } from '@/services/api'
import { extractArray } from '@/modules/dashboard/utils/normalizers'
import type { CompetitionListMeta, CompetitionSummary } from '../types'

const COMPETITIONS_PATH = (process.env.NEXT_PUBLIC_COMPETITIONS_PATH ?? '/v1/auth/competitions').replace(/\/$/, '')

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

function normalizeMeta(meta: Record<string, unknown> | undefined): CompetitionListMeta {
  const currentPage = asNumber(meta?.current_page) ?? asNumber(meta?.currentPage) ?? 1
  const lastPage = asNumber(meta?.last_page) ?? asNumber(meta?.lastPage) ?? currentPage
  const perPage = asNumber(meta?.per_page) ?? asNumber(meta?.perPage) ?? 10
  const total = asNumber(meta?.total) ?? 0
  return { currentPage, lastPage, perPage, total }
}

function normalizeCompetition(item: Record<string, unknown>): CompetitionSummary | null {
  const id = asString(item.id)
  const name = asString(item.name)
  if (!id || !name) return null
  const season = asString(item.season)
  const type = asString(item.type_id ?? item.type)
  const country = asString(item.country_id ?? item.country)
  const category = asString(item.category)
  const scope = asString(item.scope)
  const naipe = asString(item.naipe)
  const updatedAt = asString(item.updated_at ?? item.updatedAt)
  const deletedAt = asString(item.deleted_at ?? item.deletedAt)
  const meta = item.meta && typeof item.meta === 'object' ? JSON.stringify(item.meta) : null
  const metaSummary = meta ? (meta.length > 80 ? `${meta.slice(0, 80)}…` : meta) : null

  return {
    id,
    name,
    season: season ?? undefined,
    type: type ?? undefined,
    country: country ?? undefined,
    category: category ?? undefined,
    scope: scope ?? undefined,
    naipe: naipe ?? undefined,
    updatedAt: updatedAt ?? undefined,
    status: deletedAt ? 'deleted' : 'active',
    metaSummary
  }
}

export interface CompetitionListResult {
  items: CompetitionSummary[]
  meta: CompetitionListMeta
  error?: string
  source: 'api' | 'mock'
}

export const CompetitionsGateway = {
  async list(): Promise<CompetitionListResult> {
    const api = await getApi()
    const { data } = await api.get(COMPETITIONS_PATH)
    const payload = data ?? data?.data
    const candidates = extractArray(payload?.data ?? payload)
    const items = candidates
      .map((item) => (item && typeof item === 'object' ? normalizeCompetition(item as Record<string, unknown>) : null))
      .filter((item): item is CompetitionSummary => Boolean(item))
    const meta = normalizeMeta((payload?.meta ?? {}) as Record<string, unknown>)
    return { items, meta, source: 'api' }
  },

  async getById(id: string | number): Promise<CompetitionSummary> {
    const api = await getApi()
    const { data } = await api.get(`${COMPETITIONS_PATH}/${id}`)
    const detail = normalizeCompetition((data?.data ?? data) as Record<string, unknown>)
    if (!detail) {
      throw new Error('Competição não encontrada.')
    }
    return detail
  },

  async update(id: string | number, payload: Partial<CompetitionSummary>): Promise<CompetitionSummary> {
    const api = await getApi()
    const { data } = await api.patch(`${COMPETITIONS_PATH}/${id}`, {
      name: payload.name,
      season: payload.season,
      type_id: payload.type,
      country_id: payload.country,
      scope: payload.scope ?? null,
      naipe: payload.naipe ?? null,
      category: payload.category ?? null,
      meta: payload.metaSummary ? { summary: payload.metaSummary } : undefined
    })
    const detail = normalizeCompetition((data?.data ?? data) as Record<string, unknown>)
    if (!detail) {
      throw new Error('Não foi possível atualizar competição.')
    }
    return detail
  },

  async remove(id: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${COMPETITIONS_PATH}/${id}`)
  }
}
