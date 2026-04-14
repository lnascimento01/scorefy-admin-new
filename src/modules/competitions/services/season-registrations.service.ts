import { extractArray } from '@/modules/dashboard/utils/normalizers'
import { getApi } from '@/services/api'
import type {
  CompetitionSeasonRegistrationPlayerSummary,
  CompetitionSeasonRegistrationSettings,
  CompetitionSeasonRegistrationTeamSummary,
  CompetitionSeasonTeamPlayerRegistration,
  CompetitionSeasonTeamPlayerRegistrationCreatePayload,
  CompetitionSeasonTeamPlayerRegistrationUpdatePayload,
  CompetitionSeasonTeamRegistration,
  CompetitionSeasonTeamRegistrationCreatePayload,
  CompetitionSeasonTeamRegistrationUpdatePayload,
  JsonValue,
} from '../types'

const COMPETITION_SEASONS_PATH = (process.env.NEXT_PUBLIC_COMPETITION_SEASONS_PATH ?? '/v1/auth/competition-seasons').replace(/\/$/, '')
const TEAM_REGISTRATIONS_PATH = (process.env.NEXT_PUBLIC_COMPETITION_SEASON_TEAM_REGISTRATIONS_PATH ?? '/v1/auth/competition-season-team-registrations').replace(/\/$/, '')
const PLAYER_REGISTRATIONS_PATH = (process.env.NEXT_PUBLIC_COMPETITION_SEASON_TEAM_PLAYER_REGISTRATIONS_PATH ?? '/v1/auth/competition-season-team-player-registrations').replace(/\/$/, '')
const TEAMS_PATH = (process.env.NEXT_PUBLIC_TEAMS_PATH ?? '/v1/auth/teams').replace(/\/$/, '')
const PLAYERS_PATH = (process.env.NEXT_PUBLIC_PLAYERS_PATH ?? '/v1/auth/players').replace(/\/$/, '')

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
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return null
}

function asJsonValue(value: unknown, fallback: JsonValue): JsonValue {
  if (Array.isArray(value)) return value as JsonValue
  if (value && typeof value === 'object') return value as JsonValue
  return fallback
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

function normalizeTeamSummary(raw: unknown): CompetitionSeasonRegistrationTeamSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id)
  const name = asString(record.name)
  if (!id || !name) return null

  const state = record.state && typeof record.state === 'object' ? (record.state as Record<string, unknown>) : undefined
  const country = record.country && typeof record.country === 'object' ? (record.country as Record<string, unknown>) : undefined

  return {
    id,
    name,
    shortName: asString(record.short_name ?? record.shortName) ?? undefined,
    city: asString(record.city) ?? undefined,
    state: asString(state?.name ?? record.state_name ?? record.stateName ?? record.state_code ?? record.stateCode) ?? undefined,
    country: asString(country?.name ?? record.country_name ?? record.countryName ?? record.country_code ?? record.countryCode) ?? undefined,
  }
}

function normalizePlayerSummary(raw: unknown): CompetitionSeasonRegistrationPlayerSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id)
  const fullName = asString(record.full_name ?? record.fullName)
  if (!id || !fullName) return null

  const position = record.position && typeof record.position === 'object' ? (record.position as Record<string, unknown>) : undefined

  return {
    id,
    teamId: asString(record.team_id ?? record.teamId) ?? undefined,
    fullName,
    nickname: asString(record.nickname) ?? undefined,
    number: asNumber(record.number) ?? undefined,
    positionName: asString(position?.name ?? record.position_name ?? record.positionName) ?? undefined,
    isActive: asBoolean(record.is_active ?? record.isActive) ?? undefined,
  }
}

function normalizePlayerRegistration(raw: unknown): CompetitionSeasonTeamPlayerRegistration | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id)
  const registrationId = asString(record.competition_season_team_registration_id ?? record.competitionSeasonTeamRegistrationId)
  const playerId = asString(record.player_id ?? record.playerId)
  const registrationStatus = asString(record.registration_status ?? record.registrationStatus)
  const eligibilityStatus = asString(record.eligibility_status ?? record.eligibilityStatus)

  if (!id || !registrationId || !playerId || !registrationStatus || !eligibilityStatus) return null

  return {
    id,
    competitionSeasonTeamRegistrationId: registrationId,
    playerId,
    registrationStatus: registrationStatus as CompetitionSeasonTeamPlayerRegistration['registrationStatus'],
    eligibilityStatus: eligibilityStatus as CompetitionSeasonTeamPlayerRegistration['eligibilityStatus'],
    shirtNumber: asNumber(record.shirt_number ?? record.shirtNumber) ?? undefined,
    position: asString(record.position),
    isCaptain: asBoolean(record.is_captain ?? record.isCaptain) ?? false,
    submittedAt: asString(record.submitted_at ?? record.submittedAt) ?? undefined,
    approvedAt: asString(record.approved_at ?? record.approvedAt) ?? undefined,
    rejectedAt: asString(record.rejected_at ?? record.rejectedAt) ?? undefined,
    removedAt: asString(record.removed_at ?? record.removedAt) ?? undefined,
    suspendedAt: asString(record.suspended_at ?? record.suspendedAt) ?? undefined,
    notes: asString(record.notes),
    rejectionReason: asString(record.rejection_reason ?? record.rejectionReason),
    meta: asJsonValue(record.meta, {}),
    isActive: asBoolean(record.is_active ?? record.isActive) ?? false,
    player: normalizePlayerSummary(record.player),
    createdAt: asString(record.created_at ?? record.createdAt) ?? undefined,
    updatedAt: asString(record.updated_at ?? record.updatedAt) ?? undefined,
  }
}

function normalizeTeamRegistration(raw: unknown): CompetitionSeasonTeamRegistration | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const id = asString(record.id)
  const seasonId = asString(record.competition_season_id ?? record.competitionSeasonId)
  const teamId = asString(record.team_id ?? record.teamId)
  const registrationStatus = asString(record.registration_status ?? record.registrationStatus)
  const eligibilityStatus = asString(record.eligibility_status ?? record.eligibilityStatus)

  if (!id || !seasonId || !teamId || !registrationStatus || !eligibilityStatus) return null

  return {
    id,
    competitionSeasonId: seasonId,
    teamId,
    registrationStatus: registrationStatus as CompetitionSeasonTeamRegistration['registrationStatus'],
    eligibilityStatus: eligibilityStatus as CompetitionSeasonTeamRegistration['eligibilityStatus'],
    submittedAt: asString(record.submitted_at ?? record.submittedAt) ?? undefined,
    reviewedAt: asString(record.reviewed_at ?? record.reviewedAt) ?? undefined,
    approvedAt: asString(record.approved_at ?? record.approvedAt) ?? undefined,
    rejectedAt: asString(record.rejected_at ?? record.rejectedAt) ?? undefined,
    withdrawnAt: asString(record.withdrawn_at ?? record.withdrawnAt) ?? undefined,
    suspendedAt: asString(record.suspended_at ?? record.suspendedAt) ?? undefined,
    lockedAt: asString(record.locked_at ?? record.lockedAt) ?? undefined,
    notes: asString(record.notes),
    rejectionReason: asString(record.rejection_reason ?? record.rejectionReason),
    meta: asJsonValue(record.meta, {}),
    playersCount: asNumber(record.players_count ?? record.playersCount) ?? 0,
    activePlayersCount: asNumber(record.active_players_count ?? record.activePlayersCount) ?? 0,
    eligiblePlayersCount: asNumber(record.eligible_players_count ?? record.eligiblePlayersCount) ?? 0,
    pendingPlayersCount: asNumber(record.pending_players_count ?? record.pendingPlayersCount) ?? 0,
    ineligiblePlayersCount: asNumber(record.ineligible_players_count ?? record.ineligiblePlayersCount) ?? 0,
    pendingAlerts: extractArray(record.pending_alerts ?? record.pendingAlerts).map((item) => asString(item)).filter((item): item is string => Boolean(item)),
    registrationSettings: normalizeRegistrationSettings(record.registration_settings ?? record.registrationSettings),
    team: normalizeTeamSummary(record.team),
    players: extractArray(record.players).map((item) => normalizePlayerRegistration(item)).filter((item): item is CompetitionSeasonTeamPlayerRegistration => Boolean(item)),
    createdAt: asString(record.created_at ?? record.createdAt) ?? undefined,
    updatedAt: asString(record.updated_at ?? record.updatedAt) ?? undefined,
  }
}

function extractPayloadArray(data: unknown) {
  const payload = (data ?? {}) as Record<string, unknown>
  return extractArray(payload.data ?? payload)
}

async function fetchCollection(path: string, params?: Record<string, unknown>) {
  const api = await getApi()
  const { data } = await api.get(path, { params })
  return extractPayloadArray(data)
}

export const SeasonRegistrationsGateway = {
  async listTeamRegistrations(seasonId: string | number): Promise<CompetitionSeasonTeamRegistration[]> {
    const items = await fetchCollection(`${COMPETITION_SEASONS_PATH}/${seasonId}/team-registrations`, {
      per_page: 100,
      sort: 'team_name',
    })

    return items
      .map((item) => normalizeTeamRegistration(item))
      .filter((item): item is CompetitionSeasonTeamRegistration => Boolean(item))
  },

  async getTeamRegistration(registrationId: string | number): Promise<CompetitionSeasonTeamRegistration> {
    const api = await getApi()
    const { data } = await api.get(`${TEAM_REGISTRATIONS_PATH}/${registrationId}`)
    const detail = normalizeTeamRegistration((data?.data ?? data) as Record<string, unknown>)
    if (!detail) throw new Error('Inscrição do time não encontrada.')
    return detail
  },

  async createTeamRegistration(
    seasonId: string | number,
    payload: CompetitionSeasonTeamRegistrationCreatePayload,
  ): Promise<CompetitionSeasonTeamRegistration> {
    const api = await getApi()
    const { data } = await api.post(`${COMPETITION_SEASONS_PATH}/${seasonId}/team-registrations`, {
      team_id: payload.teamId,
      registration_status: payload.registrationStatus,
      eligibility_status: payload.eligibilityStatus,
      notes: payload.notes,
      rejection_reason: payload.rejectionReason,
      meta: payload.meta,
    })
    const detail = normalizeTeamRegistration((data?.data ?? data) as Record<string, unknown>)
    if (!detail) throw new Error('Não foi possível criar a inscrição do time.')
    return detail
  },

  async updateTeamRegistration(
    registrationId: string | number,
    payload: CompetitionSeasonTeamRegistrationUpdatePayload,
  ): Promise<CompetitionSeasonTeamRegistration> {
    const api = await getApi()
    const { data } = await api.patch(`${TEAM_REGISTRATIONS_PATH}/${registrationId}`, {
      registration_status: payload.registrationStatus,
      eligibility_status: payload.eligibilityStatus,
      notes: payload.notes,
      rejection_reason: payload.rejectionReason,
      meta: payload.meta,
    })
    const detail = normalizeTeamRegistration((data?.data ?? data) as Record<string, unknown>)
    if (!detail) throw new Error('Não foi possível atualizar a inscrição do time.')
    return detail
  },

  async deleteTeamRegistration(registrationId: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${TEAM_REGISTRATIONS_PATH}/${registrationId}`)
  },

  async addPlayerRegistration(
    registrationId: string | number,
    payload: CompetitionSeasonTeamPlayerRegistrationCreatePayload,
  ): Promise<CompetitionSeasonTeamPlayerRegistration> {
    const api = await getApi()
    const { data } = await api.post(`${TEAM_REGISTRATIONS_PATH}/${registrationId}/players`, {
      player_id: payload.playerId,
      registration_status: payload.registrationStatus,
      eligibility_status: payload.eligibilityStatus,
      shirt_number: payload.shirtNumber,
      position: payload.position,
      is_captain: payload.isCaptain,
      notes: payload.notes,
      rejection_reason: payload.rejectionReason,
      meta: payload.meta,
    })
    const detail = normalizePlayerRegistration((data?.data ?? data) as Record<string, unknown>)
    if (!detail) throw new Error('Não foi possível inscrever o atleta.')
    return detail
  },

  async updatePlayerRegistration(
    playerRegistrationId: string | number,
    payload: CompetitionSeasonTeamPlayerRegistrationUpdatePayload,
  ): Promise<CompetitionSeasonTeamPlayerRegistration> {
    const api = await getApi()
    const { data } = await api.patch(`${PLAYER_REGISTRATIONS_PATH}/${playerRegistrationId}`, {
      registration_status: payload.registrationStatus,
      eligibility_status: payload.eligibilityStatus,
      shirt_number: payload.shirtNumber,
      position: payload.position,
      is_captain: payload.isCaptain,
      notes: payload.notes,
      rejection_reason: payload.rejectionReason,
      meta: payload.meta,
    })
    const detail = normalizePlayerRegistration((data?.data ?? data) as Record<string, unknown>)
    if (!detail) throw new Error('Não foi possível atualizar a inscrição do atleta.')
    return detail
  },

  async deletePlayerRegistration(playerRegistrationId: string | number): Promise<void> {
    const api = await getApi()
    await api.delete(`${PLAYER_REGISTRATIONS_PATH}/${playerRegistrationId}`)
  },

  async searchTeams(query: string): Promise<CompetitionSeasonRegistrationTeamSummary[]> {
    const items = await fetchCollection(TEAMS_PATH, {
      q: query.trim() || undefined,
      per_page: 60,
      sort: 'name',
    })

    return items
      .map((item) => normalizeTeamSummary(item))
      .filter((item): item is CompetitionSeasonRegistrationTeamSummary => Boolean(item))
  },

  async searchPlayers(teamId: string | number, query: string): Promise<CompetitionSeasonRegistrationPlayerSummary[]> {
    const items = await fetchCollection(PLAYERS_PATH, {
      team_id: teamId,
      q: query.trim() || undefined,
      per_page: 100,
      sort: 'last_name',
    })

    return items
      .map((item) => normalizePlayerSummary(item))
      .filter((item): item is CompetitionSeasonRegistrationPlayerSummary => Boolean(item))
  },
}
