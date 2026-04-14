import { extractArray } from '@/modules/dashboard/utils/normalizers'
import { getApi } from '@/services/api'
import type {
  Competition,
  CompetitionConfigSnapshot,
  CompetitionCountry,
  CompetitionCreatePayload,
  CompetitionHandballRule,
  CompetitionHandballRulesPayload,
  CompetitionHandballRulesSnapshot,
  CompetitionListFilters,
  CompetitionListMeta,
  CompetitionSeasonRegistrationSettings,
  CompetitionSeason,
  CompetitionSeasonCreatePayload,
  CompetitionSeasonListItem,
  CompetitionSeasonUpdatePayload,
  CompetitionSort,
  CompetitionStatus,
  CompetitionTypeOption,
  CompetitionUpdatePayload,
  JsonObject,
  JsonValue,
} from '../types'

const COMPETITIONS_PATH = (process.env.NEXT_PUBLIC_COMPETITIONS_PATH ?? '/v1/auth/competitions').replace(/\/$/, '')
const COMPETITION_SEASONS_PATH = (process.env.NEXT_PUBLIC_COMPETITION_SEASONS_PATH ?? '/v1/auth/competition-seasons').replace(/\/$/, '')
const COMPETITION_TYPES_PATH = (process.env.NEXT_PUBLIC_COMPETITION_TYPES_PATH ?? '/v1/auth/competition-types').replace(/\/$/, '')
const COUNTRIES_PATH = (process.env.NEXT_PUBLIC_COUNTRIES_PATH ?? '/v1/auth/countries').replace(/\/$/, '')

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
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
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return null
}

function asJsonValue(value: unknown, fallback: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value as JsonValue
  }
  if (value && typeof value === 'object') {
    return value as JsonObject
  }
  return fallback
}

function normalizeMeta(meta: Record<string, unknown> | undefined): CompetitionListMeta {
  const currentPage = asNumber(meta?.current_page) ?? asNumber(meta?.currentPage) ?? 1
  const lastPage = asNumber(meta?.last_page) ?? asNumber(meta?.lastPage) ?? currentPage
  const perPage = asNumber(meta?.per_page) ?? asNumber(meta?.perPage) ?? 20
  const total = asNumber(meta?.total) ?? 0
  return { currentPage, lastPage, perPage, total }
}

function normalizeCountry(raw: unknown): CompetitionCountry | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id)
  const name = asString(record.name)
  if (!id || !name) return null
  return {
    id,
    name,
    code: asString(record.code) ?? undefined,
  }
}

function normalizeType(raw: unknown): CompetitionTypeOption | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id)
  const name = asString(record.name)
  if (!id || !name) return null

  return {
    id,
    name,
    slug: asString(record.slug) ?? undefined,
    description: asString(record.description) ?? undefined,
    defaults: asJsonValue(record.defaults, {}),
  }
}

function normalizeHandballRule(raw: unknown): CompetitionHandballRule | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  return {
    pointsForWin: asNumber(record.points_for_win ?? record.pointsForWin) ?? undefined,
    pointsForDraw: asNumber(record.points_for_draw ?? record.pointsForDraw) ?? undefined,
    pointsForLoss: asNumber(record.points_for_loss ?? record.pointsForLoss) ?? undefined,
    pointsForOvertimeWin: asNumber(record.points_for_overtime_win ?? record.pointsForOvertimeWin) ?? undefined,
    pointsForOvertimeLoss: asNumber(record.points_for_overtime_loss ?? record.pointsForOvertimeLoss) ?? undefined,
    pointsForPenaltyWin: asNumber(record.points_for_penalty_win ?? record.pointsForPenaltyWin) ?? undefined,
    pointsForPenaltyLoss: asNumber(record.points_for_penalty_loss ?? record.pointsForPenaltyLoss) ?? undefined,
    allowDraws: asBoolean(record.allow_draws ?? record.allowDraws) ?? undefined,
    tiebreakers: extractArray(record.tiebreakers).map((item) => asString(item)).filter((item): item is string => Boolean(item)),
    updatedAt: asString(record.updated_at ?? record.updatedAt) ?? undefined,
  }
}

function normalizeRegistrationSettings(raw: unknown): CompetitionSeasonRegistrationSettings | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  return {
    enabled: asBoolean(record.enabled) ?? true,
    windowStartAt: asString(record.window_start_at ?? record.windowStartAt) ?? undefined,
    windowEndAt: asString(record.window_end_at ?? record.windowEndAt) ?? undefined,
    lateEntryStartAt: asString(record.late_entry_start_at ?? record.lateEntryStartAt) ?? undefined,
    lateEntryEndAt: asString(record.late_entry_end_at ?? record.lateEntryEndAt) ?? undefined,
    minRosterSize: asNumber(record.min_roster_size ?? record.minRosterSize) ?? undefined,
    maxRosterSize: asNumber(record.max_roster_size ?? record.maxRosterSize) ?? undefined,
    allowReplacementAfterApproval: asBoolean(record.allow_replacement_after_approval ?? record.allowReplacementAfterApproval) ?? true,
    lockAfterAt: asString(record.lock_after_at ?? record.lockAfterAt) ?? undefined,
    requireUniqueShirtNumber: asBoolean(record.require_unique_shirt_number ?? record.requireUniqueShirtNumber) ?? true,
    ageMin: asNumber(record.age_min ?? record.ageMin) ?? undefined,
    ageMax: asNumber(record.age_max ?? record.ageMax) ?? undefined,
    requireDocuments: asBoolean(record.require_documents ?? record.requireDocuments) ?? false,
  }
}

function normalizeSeasonListItem(raw: unknown, fallbackCompetitionId?: string): CompetitionSeasonListItem | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id ?? record.competition_season_id ?? record.season_id ?? record.seasonId)
  const name =
    asString(record.name) ??
    asString(record.label) ??
    asString(record.season) ??
    asString(record.season_code ?? record.seasonCode) ??
    asString(record.reference_year_start ?? record.referenceYearStart)
  const season =
    asString(record.season ?? record.season_code ?? record.seasonCode ?? record.reference_year_start ?? record.referenceYearStart) ?? ''
  const status = (asString(record.status) as CompetitionStatus | null) ?? 'draft'
  const competitionId = asString(record.competition_id ?? record.competitionId) ?? fallbackCompetitionId
  if (!id || !name || !competitionId) return null

  return {
    id,
    name,
    label: asString(record.label ?? record.name) ?? undefined,
    season,
    status,
    competitionId,
    referenceYearStart: asNumber(record.reference_year_start ?? record.referenceYearStart) ?? undefined,
    referenceYearEnd: asNumber(record.reference_year_end ?? record.referenceYearEnd) ?? undefined,
    startAt: asString(record.start_at ?? record.startAt) ?? undefined,
    endAt: asString(record.end_at ?? record.endAt) ?? undefined,
    meta: asJsonValue(record.meta, {}),
    updatedAt: asString(record.updated_at ?? record.updatedAt) ?? undefined,
  }
}

function normalizeSeason(raw: unknown): CompetitionSeason | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const listItem = normalizeSeasonListItem(record)
  if (!listItem) return null

  return {
    ...listItem,
    configOverrides: asJsonValue(record.config_overrides ?? record.configOverrides, []),
    effectiveConfig: asJsonValue(record.effective_config ?? record.effectiveConfig, []),
    registrationSettings: normalizeRegistrationSettings(
      record.registration_settings
      ?? record.registrationSettings
      ?? ((record.effective_config ?? record.effectiveConfig) as Record<string, unknown> | undefined)?.registrations
    ),
    handballRule: normalizeHandballRule(record.handball_rule ?? record.handball_rules ?? record.rules ?? record.handballRule),
    createdAt: asString(record.created_at ?? record.createdAt) ?? undefined,
  }
}

function normalizeCompetition(raw: unknown): Competition | null {
  if (!raw || typeof raw !== 'object') return null

  const item = raw as Record<string, unknown>
  const typeRecord = item.type && typeof item.type === 'object' ? (item.type as Record<string, unknown>) : undefined
  const id = asString(item.id)
  const name = asString(item.name)
  const locale = asString(item.locale) ?? 'pt-BR'
  const status = (asString(item.status) as CompetitionStatus | null) ?? 'draft'
  const typeId = asString(item.type_id ?? item.typeId)

  if (!id || !name || !typeId) {
    return null
  }

  const latestSeason = normalizeSeasonListItem(item.latest_season ?? item.latestSeason, id ?? undefined)
  const seasonsCount = asNumber(item.seasons_count ?? item.seasonsCount)

  return {
    id,
    name,
    locale,
    status,
    typeId,
    typeName: asString(typeRecord?.name ?? item.type_name ?? item.typeName ?? item.type) ?? undefined,
    countryId: asString(item.country_id ?? item.countryId) ?? undefined,
    country: normalizeCountry(item.country),
    scope: (asString(item.scope) as Competition['scope'] | null) ?? 'national',
    naipe: (asString(item.naipe) as Competition['naipe']) ?? null,
    category: asString(item.category),
    meta: asJsonValue(item.meta, {}),
    seasonsCount: seasonsCount ?? undefined,
    latestSeason,
    createdAt: asString(item.created_at ?? item.createdAt) ?? undefined,
    updatedAt: asString(item.updated_at ?? item.updatedAt) ?? undefined,
  }
}

function normalizeConfigSnapshot(raw: unknown): CompetitionConfigSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const competitionSeasonId = asString(record.competition_season_id ?? record.competitionSeasonId)
  if (!competitionSeasonId) return null

  return {
    competitionSeasonId,
    overrides: asJsonValue(record.overrides, {}),
    effective: asJsonValue(record.effective, {}),
    updatedAt: asString(record.updated_at ?? record.updatedAt) ?? undefined,
  }
}

function normalizeHandballRulesSnapshot(raw: unknown): CompetitionHandballRulesSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const competitionSeasonId = asString(record.competition_season_id ?? record.competitionSeasonId)
  const rules = normalizeHandballRule(record.rules)
  if (!competitionSeasonId || !rules) return null

  return {
    competitionSeasonId,
    updatedAt: asString(record.updated_at ?? record.updatedAt) ?? undefined,
    rules,
  }
}

function buildListParams(filters: CompetitionListFilters = {}) {
  return {
    q: filters.q?.trim() || undefined,
    country_id: filters.countryId || undefined,
    scope: filters.scope || undefined,
    type_id: filters.typeId || undefined,
    naipe: filters.naipe || undefined,
    category: filters.category?.trim() || undefined,
    page: filters.page,
    per_page: filters.perPage,
    sort: (filters.sort ?? 'name') as CompetitionSort,
  }
}

export interface CompetitionListResult {
  items: Competition[]
  meta: CompetitionListMeta
  source: 'api'
}

export const CompetitionsGateway = {
  async list(filters: CompetitionListFilters = {}): Promise<CompetitionListResult> {
    const api = await getApi()
    const { data } = await api.get(COMPETITIONS_PATH, {
      params: buildListParams(filters),
    })
    const payload = (data ?? {}) as Record<string, unknown>
    const items = extractArray(payload.data ?? payload)
      .map((item) => normalizeCompetition(item))
      .filter((item): item is Competition => Boolean(item))
    const meta = normalizeMeta((payload.meta ?? {}) as Record<string, unknown>)
    return { items, meta, source: 'api' }
  },

  async getById(id: string | number): Promise<Competition> {
    const api = await getApi()
    const { data } = await api.get(`${COMPETITIONS_PATH}/${id}`)
    const detail = normalizeCompetition(data?.data ?? data)
    if (!detail) {
      throw new Error('Competição não encontrada.')
    }
    return detail
  },

  async create(payload: CompetitionCreatePayload): Promise<Competition> {
    const api = await getApi()
    const { data } = await api.post(COMPETITIONS_PATH, {
      name: payload.name,
      locale: payload.locale,
      status: payload.status,
      type_id: payload.typeId,
      country_id: payload.countryId,
      scope: payload.scope,
      naipe: payload.naipe,
      category: payload.category,
      meta: payload.meta,
    })
    const created = normalizeCompetition(data?.data ?? data)
    if (!created) {
      throw new Error('Não foi possível criar a competição.')
    }
    return created
  },

  async update(id: string | number, payload: CompetitionUpdatePayload): Promise<Competition> {
    const api = await getApi()
    const { data } = await api.patch(`${COMPETITIONS_PATH}/${id}`, {
      name: payload.name,
      locale: payload.locale,
      status: payload.status,
      type_id: payload.typeId,
      country_id: payload.countryId,
      scope: payload.scope,
      naipe: payload.naipe,
      category: payload.category,
      meta: payload.meta,
    })
    const updated = normalizeCompetition(data?.data ?? data)
    if (!updated) {
      throw new Error('Não foi possível atualizar a competição.')
    }
    return updated
  },

  async remove(id: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${COMPETITIONS_PATH}/${id}`)
  },

  async listCompetitionTypes(): Promise<CompetitionTypeOption[]> {
    const api = await getApi()
    const { data } = await api.get(COMPETITION_TYPES_PATH, {
      params: { per_page: 100, sort: 'name' },
    })
    const payload = (data ?? {}) as Record<string, unknown>
    return extractArray(payload.data ?? payload)
      .map((item) => normalizeType(item))
      .filter((item): item is CompetitionTypeOption => Boolean(item))
  },

  async listCountries(): Promise<CompetitionCountry[]> {
    const api = await getApi()
    const { data } = await api.get(COUNTRIES_PATH, {
      params: { per_page: 100, sort: 'name' },
    })
    const payload = (data ?? {}) as Record<string, unknown>
    return extractArray(payload.data ?? payload)
      .map((item) => normalizeCountry(item))
      .filter((item): item is CompetitionCountry => Boolean(item))
  },

  async listSeasons(competitionId: string | number): Promise<CompetitionSeasonListItem[]> {
    const api = await getApi()
    const { data } = await api.get(`${COMPETITIONS_PATH}/${competitionId}/seasons`, {
      params: { per_page: 100, sort: '-reference_year_start' },
    })
    const payload = (data ?? {}) as Record<string, unknown>
    const extracted = extractArray(payload.data ?? payload)
    const normalized = extracted
      .map((item) => normalizeSeasonListItem(item, String(competitionId)))
      .filter((item): item is CompetitionSeasonListItem => Boolean(item))
    return normalized
  },

  async getSeason(seasonId: string | number): Promise<CompetitionSeason> {
    const api = await getApi()
    const { data } = await api.get(`${COMPETITION_SEASONS_PATH}/${seasonId}`)
    const season = normalizeSeason(data?.data ?? data)
    if (!season) {
      throw new Error('Temporada não encontrada.')
    }
    return season
  },

  async createSeason(competitionId: string | number, payload: CompetitionSeasonCreatePayload): Promise<CompetitionSeason> {
    const api = await getApi()
    const { data } = await api.post(`${COMPETITIONS_PATH}/${competitionId}/seasons`, {
      name: payload.name,
      label: payload.label,
      season: payload.season,
      status: payload.status,
      reference_year_start: payload.referenceYearStart,
      reference_year_end: payload.referenceYearEnd,
      start_at: payload.startAt,
      end_at: payload.endAt,
      meta: payload.meta,
    })
    const season = normalizeSeason(data?.data ?? data)
    if (!season) {
      throw new Error('Não foi possível criar a temporada.')
    }
    return season
  },

  async updateSeason(seasonId: string | number, payload: CompetitionSeasonUpdatePayload): Promise<CompetitionSeason> {
    const api = await getApi()
    const { data } = await api.patch(`${COMPETITION_SEASONS_PATH}/${seasonId}`, {
      name: payload.name,
      label: payload.label,
      season: payload.season,
      status: payload.status,
      reference_year_start: payload.referenceYearStart,
      reference_year_end: payload.referenceYearEnd,
      start_at: payload.startAt,
      end_at: payload.endAt,
      meta: payload.meta,
    })
    const season = normalizeSeason(data?.data ?? data)
    if (!season) {
      throw new Error('Não foi possível atualizar a temporada.')
    }
    return season
  },

  async deleteSeason(seasonId: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${COMPETITION_SEASONS_PATH}/${seasonId}`)
  },

  async updateSeasonConfig(seasonId: string | number, overrides: JsonValue): Promise<CompetitionConfigSnapshot> {
    const api = await getApi()
    const { data } = await api.patch(`${COMPETITION_SEASONS_PATH}/${seasonId}/config`, {
      overrides,
    })
    const snapshot = normalizeConfigSnapshot(data?.data ?? data)
    if (!snapshot) {
      throw new Error('Não foi possível atualizar a configuração da temporada.')
    }
    return snapshot
  },

  async updateSeasonHandballRules(seasonId: string | number, payload: CompetitionHandballRulesPayload): Promise<CompetitionHandballRulesSnapshot> {
    const api = await getApi()
    const { data } = await api.patch(`${COMPETITION_SEASONS_PATH}/${seasonId}/handball-rules`, {
      points_for_win: payload.pointsForWin,
      points_for_draw: payload.pointsForDraw,
      points_for_loss: payload.pointsForLoss,
      points_for_overtime_win: payload.pointsForOvertimeWin,
      points_for_overtime_loss: payload.pointsForOvertimeLoss,
      points_for_penalty_win: payload.pointsForPenaltyWin,
      points_for_penalty_loss: payload.pointsForPenaltyLoss,
      allow_draws: payload.allowDraws,
      tiebreakers: payload.tiebreakers,
    })
    const snapshot = normalizeHandballRulesSnapshot(data?.data ?? data)
    if (!snapshot) {
      throw new Error('Não foi possível atualizar as regras da temporada.')
    }
    return snapshot
  },
}
