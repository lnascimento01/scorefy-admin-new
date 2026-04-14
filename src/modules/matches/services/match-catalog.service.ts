import { getApi } from '@/services/api'
import { extractArray } from '@/modules/dashboard/utils/normalizers'

export interface CatalogOption {
  id: string
  label: string
  helper?: string
  shortName?: string
  competitionId?: string
  season?: string
  metadata?: Record<string, unknown>
}

const COMPETITIONS_PATH = (process.env.NEXT_PUBLIC_COMPETITIONS_PATH ?? '/v1/auth/competitions').replace(/\/$/, '')
const TEAMS_PATH = (process.env.NEXT_PUBLIC_TEAMS_PATH ?? '/v1/auth/teams').replace(/\/$/, '')
const VENUES_PATH = (process.env.NEXT_PUBLIC_VENUES_PATH ?? '/v1/auth/venues').replace(/\/$/, '')

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

function normalizeCompetitionOption(raw: Record<string, unknown>): CatalogOption | null {
  const id = asString(raw.id)
  const name = asString(raw.name)
  if (!id || !name) return null
  return {
    id,
    label: name,
    metadata: {}
  }
}

function normalizeTeamOption(raw: Record<string, unknown>): CatalogOption | null {
  const id = asString(raw.id)
  const name = asString(raw.name ?? raw.team_name)
  if (!id || !name) return null
  const shortName = asString(raw.short_name ?? raw.shortName)
  const competitionId = asString(raw.competition_id ?? raw.competitionId ?? raw.competition_season_id ?? raw.competitionSeasonId)
  const city = asString(raw.city ?? raw.location)
  const helper = shortName ?? city ?? undefined

  return {
    id,
    label: name,
    shortName: shortName ?? undefined,
    helper,
    competitionId: competitionId ?? undefined,
    metadata: { city }
  }
}

function normalizeSeasonOption(raw: Record<string, unknown>): CatalogOption | null {
  const id = asString(raw.id)
  const name = asString(raw.name)
  const season = asString(raw.season)
  if (!id || !name || !season) return null
  return {
    id,
    label: `${name} • ${season}`,
    helper: season ?? undefined,
    season: season ?? undefined,
    competitionId: asString(raw.competition_id ?? raw.competitionId) ?? undefined,
  }
}

function normalizeVenueOption(raw: Record<string, unknown>): CatalogOption | null {
  const id = asString(raw.id)
  const name = asString(raw.name)
  if (!id || !name) return null
  const city = asString(raw.city ?? raw.location)
  const nickname = asString(raw.nickname ?? raw.short_name ?? raw.shortName)
  const helper = [nickname, city].filter(Boolean).join(' • ')
  return {
    id,
    label: name,
    helper: helper || undefined
  }
}

async function fetchList(path: string, params?: Record<string, unknown>) {
  const api = await getApi()
  const { data } = await api.get(path, {
    params: {
      per_page: 50,
      ...params
    }
  })
  const payload = (data ?? {}) as Record<string, unknown>
  return extractArray(payload.data ?? payload)
}

export const MatchCatalogGateway = {
  async listCompetitions(): Promise<CatalogOption[]> {
    const items = await fetchList(COMPETITIONS_PATH)
    return items
      .map((item) => (item && typeof item === 'object' ? normalizeCompetitionOption(item as Record<string, unknown>) : null))
      .filter((item): item is CatalogOption => Boolean(item))
  },

  async listCompetitionSeasons(competitionId: string): Promise<CatalogOption[]> {
    const items = await fetchList(`${COMPETITIONS_PATH}/${competitionId}/seasons`)
    return items
      .map((item) => (item && typeof item === 'object' ? normalizeSeasonOption(item as Record<string, unknown>) : null))
      .filter((item): item is CatalogOption => Boolean(item))
  },

  async listTeams(competitionSeasonId?: string): Promise<CatalogOption[]> {
    const items = await fetchList(TEAMS_PATH, competitionSeasonId ? { competition_season_id: competitionSeasonId } : undefined)
    return items
      .map((item) => (item && typeof item === 'object' ? normalizeTeamOption(item as Record<string, unknown>) : null))
      .filter((item): item is CatalogOption => Boolean(item))
  },

  async listVenues(): Promise<CatalogOption[]> {
    const items = await fetchList(VENUES_PATH)
    return items
      .map((item) => (item && typeof item === 'object' ? normalizeVenueOption(item as Record<string, unknown>) : null))
      .filter((item): item is CatalogOption => Boolean(item))
  }
}
