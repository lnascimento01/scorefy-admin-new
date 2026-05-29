import { getApi } from '@/services/api'
import { extractArray } from '@/modules/dashboard/utils/normalizers'
import { SeasonRegistrationsGateway } from '@/modules/competitions/services/season-registrations.service'
import type { CompetitionNaipe, CompetitionSeasonTeamRegistration } from '@/modules/competitions/types'

export interface CatalogOption {
  id: string
  label: string
  helper?: string
  shortName?: string
  competitionId?: string
  season?: string
  availableNaipes?: CompetitionNaipe[]
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
  const id = asString(raw.id ?? raw.competition_season_id ?? raw.season_id ?? raw.seasonId)
  const label =
    asString(raw.label) ??
    asString(raw.name) ??
    asString(raw.season) ??
    asString(raw.season_code ?? raw.seasonCode) ??
    asString(raw.reference_year_start ?? raw.referenceYearStart)
  const season = asString(raw.season ?? raw.season_code ?? raw.seasonCode ?? raw.reference_year_start ?? raw.referenceYearStart)
  if (!id || !label) return null
  return {
    id,
    label,
    helper: season ?? undefined,
    season: season ?? undefined,
    competitionId: asString(raw.competition_id ?? raw.competitionId) ?? undefined,
    availableNaipes: extractArray(raw.available_naipes ?? raw.availableNaipes)
      .map((item) => asString(item) as CompetitionNaipe | null)
      .filter((item): item is CompetitionNaipe => item === 'masculino' || item === 'feminino' || item === 'misto'),
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

function naipeLabel(naipe: CompetitionNaipe) {
  switch (naipe) {
    case 'masculino':
      return 'Masculino'
    case 'feminino':
      return 'Feminino'
    default:
      return 'Misto'
  }
}

function normalizeEligibleTeamOption(
  registration: CompetitionSeasonTeamRegistration,
): CatalogOption | null {
  const teamId = registration.team?.id ?? registration.teamId
  const teamName = registration.team?.name
  if (!teamId || !teamName) return null

  const helper = [
    registration.team?.shortName,
    registration.naipe ? naipeLabel(registration.naipe) : null,
  ].filter(Boolean).join(' • ')

  return {
    id: teamId,
    label: teamName,
    shortName: registration.team?.shortName ?? undefined,
    helper: helper || undefined,
    competitionId: registration.competitionSeasonId,
    availableNaipes: registration.naipe ? [registration.naipe] : undefined,
    metadata: {
      registrationId: registration.id,
      naipe: registration.naipe ?? null,
      registrationStatus: registration.registrationStatus,
      eligibilityStatus: registration.eligibilityStatus
    }
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
    return this.listSeasonTeams(competitionSeasonId)
  },

  async listSeasonTeams(competitionSeasonId?: string, naipe?: CompetitionNaipe): Promise<CatalogOption[]> {
    if (!competitionSeasonId) return []

    const registrations = await SeasonRegistrationsGateway.listTeamRegistrations(competitionSeasonId)
    const options = registrations
      .filter((registration) => {
        const isActive = ['draft', 'submitted', 'under_review', 'approved'].includes(registration.registrationStatus)
        const isEligible = registration.eligibilityStatus === 'eligible'
        const matchesNaipe = naipe ? registration.naipe === naipe : true
        return isActive && isEligible && matchesNaipe
      })
      .map((registration) => normalizeEligibleTeamOption(registration))
      .filter((item): item is CatalogOption => Boolean(item))

    return Array.from(new Map(options.map((item) => [item.id, item])).values())
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  },

  async listVenues(): Promise<CatalogOption[]> {
    const items = await fetchList(VENUES_PATH)
    return items
      .map((item) => (item && typeof item === 'object' ? normalizeVenueOption(item as Record<string, unknown>) : null))
      .filter((item): item is CatalogOption => Boolean(item))
  }
}
