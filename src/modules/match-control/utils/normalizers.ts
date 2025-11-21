import type {
  MatchControlDetail,
  MatchControlEvent,
  MatchControlParticipant,
  MatchControlTeamInfo,
  MatchSide
} from '../types'
import type { MatchStatus } from '@/modules/matches/types'

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
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function normalizeTeam(
  raw: Record<string, unknown> | null | undefined,
  fallbackName: string,
  fallbackShort?: string,
  score = 0
): MatchControlTeamInfo {
  const colors = (raw?.colors as Record<string, string> | undefined) ?? {}
  return {
    id: asString(raw?.id) ?? fallbackName,
    name: asString(raw?.name) ?? fallbackName,
    shortName: asString(raw?.short_name ?? raw?.shortName) ?? fallbackShort,
    slug: asString(raw?.slug),
    city: asString(raw?.city) ?? null,
    colors: {
      primary: asString(colors.primary),
      secondary: asString(colors.secondary)
    },
    score
  }
}

function resolvePersonName(record: Record<string, unknown>): string | null {
  const first = asString(record.first_name ?? record.firstName)
  const last = asString(record.last_name ?? record.lastName)
  const fullName = [first, last].filter(Boolean).join(' ').trim()
  if (fullName) return fullName

  const nick = asString(record.nickname ?? record.nick_name)
  if (nick) return nick

  return (
    asString(record.display_name ?? record.displayName) ??
    asString(record.name) ??
    asString(record.full_name ?? record.fullName) ??
    last ??
    null
  )
}

function normalizeParticipant(
  raw: Record<string, unknown>,
  side: MatchSide
): MatchControlParticipant | null {
  const id = asString(raw.id ?? raw.player_id ?? raw.player?.id)
  const playerRecord = (raw.player ?? {}) as Record<string, unknown>
  const name =
    resolvePersonName(playerRecord) ??
    resolvePersonName(raw) ??
    asString(playerRecord.nickname ?? raw.nickname)
  if (!id || !name) return null
  const number =
    asNumber(
      playerRecord.number ??
        playerRecord.shirt_number ??
        raw.shirt_number ??
        raw.number
    ) ?? undefined
  const role = asString(playerRecord.role ?? raw.role) ?? undefined
  const position = asString(playerRecord.position ?? raw.position) ?? undefined
  const type = asString(raw.type)?.toLowerCase()

  return {
    id,
    name,
    shirtNumber: number,
    role,
    position,
    team: side,
    isStaff: type === 'staff'
  }
}

function normalizeEvent(
  raw: Record<string, unknown>,
  homeTeamId?: string | null,
  awayTeamId?: string | null
): MatchControlEvent | null {
  const id = asString(raw.id)
  if (!id) return null
  const typeRecord = (raw.type ?? raw.event_type ?? {}) as Record<string, unknown>
  const playerRecord = (raw.player ?? raw.player_info ?? raw.playerInfo ?? {}) as Record<
    string,
    unknown
  >
  const teamId = asString(raw.team_id ?? raw.team?.id ?? playerRecord.team_id)
  let team: MatchSide | undefined
  if (teamId && homeTeamId && teamId === homeTeamId) team = 'home'
  if (teamId && awayTeamId && teamId === awayTeamId) team = 'away'
  const typeName = asString(typeRecord.name ?? typeRecord.label ?? raw.type_name)
  const playerName = resolvePersonName(playerRecord) ?? asString(raw.player_name)
  const fallbackDescription = [typeName, playerName].filter(Boolean).join(' - ') || 'Evento registrado'
  const description = asString(raw.description) ?? fallbackDescription
  const timestamp = asString(raw.created_at ?? raw.timestamp ?? raw.applied_at) ?? new Date().toISOString()
  const matchTimeSeconds = asNumber(raw.match_time_seconds ?? raw.matchTimeSeconds)
  const matchTimeLabel =
    typeof matchTimeSeconds === 'number'
      ? formatMatchTime(matchTimeSeconds)
      : undefined

  return {
    id,
    team,
    playerName,
    typeName,
    description,
    timestamp,
    matchTimeLabel
  }
}

function formatMatchTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0')
  const secs = String(safe % 60).padStart(2, '0')
  return `${minutes}:${secs}`
}

export function normalizeMatchDetail(payload: unknown): MatchControlDetail | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const id = asString(record.id)
  if (!id) return null
  const status = (asString(record.status) as MatchStatus) ?? 'scheduled'
  const homeTeamId = asString(record.home_team_id ?? record.homeTeamId)
  const awayTeamId = asString(record.away_team_id ?? record.awayTeamId)
  const homeScore = asNumber(record.home_score ?? record.homeScore) ?? 0
  const awayScore = asNumber(record.away_score ?? record.awayScore) ?? 0
  const competitionId = asString(record.competition_id ?? record.competitionId ?? (record.competition as Record<string, unknown> | undefined)?.id)
  const venueId = asString(record.venue_id ?? record.venueId ?? (record.venue as Record<string, unknown> | undefined)?.id)

  const homeTeam = normalizeTeam(
    (record.home_team ?? record.homeTeam) as Record<string, unknown> | undefined,
    'Mandante',
    asString(record.home_short ?? record.homeShort),
    homeScore
  )
  const awayTeam = normalizeTeam(
    (record.away_team ?? record.awayTeam) as Record<string, unknown> | undefined,
    'Visitante',
    asString(record.away_short ?? record.awayShort),
    awayScore
  )

  const rawEvents = Array.isArray(record.events) ? (record.events as unknown[]) : []
  const events = rawEvents
    .map((event) => (event && typeof event === 'object' ? normalizeEvent(event as Record<string, unknown>, homeTeamId, awayTeamId) : null))
    .filter((event): event is MatchControlEvent => Boolean(event))

  const rawPlayers = Array.isArray(record.players) ? (record.players as unknown[]) : []
  const participantsHome: MatchControlParticipant[] = []
  const participantsAway: MatchControlParticipant[] = []
  rawPlayers.forEach((item) => {
    if (!item || typeof item !== 'object') return
    const entry = item as Record<string, unknown>
    const pivot = entry.pivot && typeof entry.pivot === 'object' ? (entry.pivot as Record<string, unknown>) : undefined
    const teamId = asString(entry.team_id ?? entry.teamId ?? pivot?.team_id)
    const side = teamId === homeTeamId ? 'home' : teamId === awayTeamId ? 'away' : undefined
    if (!side) return
    const participant = normalizeParticipant(entry, side)
    if (!participant) return
    if (side === 'home') {
      participantsHome.push(participant)
    } else {
      participantsAway.push(participant)
    }
  })

  return {
    id,
    status,
    period: asNumber(record.period ?? record.current_period) ?? undefined,
    startAt: asString(record.start_at ?? record.startAt) ?? undefined,
    competitionName: asString(record.competition?.name ?? record.competition_name),
    competitionId: competitionId ?? undefined,
    competitionSeason: asString(record.competition?.season ?? record.competition_season),
    venueName: asString(record.venue?.name ?? record.venue_name),
    venueId: venueId ?? undefined,
    broadcastUrl: asString(record.broadcast_url ?? record.broadcastUrl),
    homeTeam,
    awayTeam,
    participants: { home: participantsHome, away: participantsAway },
    events
  }
}

export function normalizeMatchEvents(payload: unknown, homeTeamId?: string | null, awayTeamId?: string | null): MatchControlEvent[] {
  if (!Array.isArray(payload)) return []
  return payload
    .map((item) => (item && typeof item === 'object' ? normalizeEvent(item as Record<string, unknown>, homeTeamId, awayTeamId) : null))
    .filter((event): event is MatchControlEvent => Boolean(event))
}
