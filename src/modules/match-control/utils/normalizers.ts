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

function resolveMatchNaipe(record: Record<string, unknown>): MatchControlDetail['naipe'] {
  const meta = (record.meta as Record<string, unknown> | undefined) ?? undefined
  const stage = (record.stage as Record<string, unknown> | undefined) ?? undefined
  const group = (record.group as Record<string, unknown> | undefined) ?? undefined

  const candidates = [
    asString(record.naipe),
    asString(meta?.naipe),
    asString(stage?.naipe),
    asString(group?.naipe),
  ]

  return (candidates.find((value) => value === 'masculino' || value === 'feminino' || value === 'misto') as MatchControlDetail['naipe']) ?? null
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

function normalizeEventTypeCode(raw: Record<string, unknown>): string | null {
  const candidates = [
    raw.type_code,
    raw.event_type_code,
    raw.event_type,
    raw.type,
    raw.kind,
    raw.code,
    raw.event,
    raw.name,
    raw.label,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (trimmed) {
        return trimmed
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/-/g, '_')
      }
    }
  }

  return null
}

function normalizeEventTypeLabel(typeCode: string | null, raw: Record<string, unknown>): string | null {
  const nestedType = raw.type && typeof raw.type === 'object' ? (raw.type as Record<string, unknown>) : undefined
  const nestedEventType = raw.event_type && typeof raw.event_type === 'object' ? (raw.event_type as Record<string, unknown>) : undefined
  const candidates = [
    asString(raw.type_name ?? raw.typeName ?? raw.label ?? raw.name ?? raw.event_label ?? raw.eventLabel),
    asString(
      nestedType?.label ??
        nestedType?.name ??
        nestedEventType?.label ??
        nestedEventType?.name
    ),
    typeCode,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const mapped = mapEventTypeLabel(candidate)
    if (mapped) {
      return mapped
    }
  }

  const candidateLabel = asString(
    nestedType?.label ??
      nestedType?.name ??
      nestedEventType?.label ??
      nestedEventType?.name
  )
  if (candidateLabel) {
    return candidateLabel
  }

  return null
}

function mapEventTypeLabel(value: string): string | null {
  const token = normalizeEventTypeToken(value)
  switch (token) {
    case 'goal':
    case 'goal_home':
    case 'goal_away':
    case 'home_goal':
    case 'away_goal':
    case 'seven_meter_goal':
    case '7m_goal':
    case 'seven_meter':
    case '7m':
      return 'Gol'
    case 'goal_missed':
    case 'seven_meter_missed':
    case '7m_missed':
    case 'seven_meter_lost':
      return '7m perdido'
    case 'timeout':
    case 'timeout_home':
    case 'timeout_away':
    case 'team_timeout':
    case 'time_out':
      return 'Timeout'
    case 'two_minutes':
    case 'two_minute':
    case 'two_minutes_home':
    case 'two_minutes_away':
    case 'exclusion_2_min':
    case 'suspension_2_min':
    case 'suspension_2min_start':
    case 'exclusao_2min':
    case '2min':
    case '2_minutes':
    case '2_min':
    case '2_minutos':
    case '2_minuto':
      return '2’'
    case 'yellow_card':
    case 'cartao_amarelo':
      return 'Cartão amarelo'
    case 'red_card':
    case 'cartao_vermelho':
      return 'Cartão vermelho'
    case 'blue_card':
    case 'cartao_azul':
      return 'Cartão azul'
    case 'disqualification':
    case 'disqualificacao':
    case 'desqualificacao':
      return 'Desqualificação'
    case '7m_perdido':
      return '7m perdido'
    default:
      return null
  }
}

function normalizeEventTypeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/__+/g, '_')
}


export function normalizeMatchEventTypeLabel(typeCode: string | null, raw: Record<string, unknown>): string | null {
  return normalizeEventTypeLabel(typeCode, raw)
}

function resolveEventScore(raw: Record<string, unknown>, side: 'home' | 'away'): number | null {
  const scoreRecord = (raw.score as Record<string, unknown> | undefined) ?? undefined
  const teamsRecord = (raw.teams as Record<string, unknown> | undefined) ?? undefined
  const homeTeamScore = (teamsRecord?.home as Record<string, unknown> | undefined)?.score
  const awayTeamScore = (teamsRecord?.away as Record<string, unknown> | undefined)?.score

  const direct = side === 'home'
    ? [
        raw.home_score,
        raw.homeScore,
        raw.score_home,
        scoreRecord?.home,
        scoreRecord?.homeScore,
        homeTeamScore,
      ]
    : [
        raw.away_score,
        raw.awayScore,
        raw.score_away,
        scoreRecord?.away,
        scoreRecord?.awayScore,
        awayTeamScore,
      ]

  for (const candidate of direct) {
    const parsed = asNumber(candidate)
    if (typeof parsed === 'number') return parsed
  }

  return null
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
  const positionRecord = (playerRecord.position ?? raw.position) as Record<string, unknown> | undefined
  const position =
    asString(positionRecord?.name ?? positionRecord?.label) ??
    asString(playerRecord.position_name ?? raw.position_name ?? raw.positionName) ??
    asString(playerRecord.position ?? raw.position) ??
    undefined
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
  const playerId = asString(raw.player_id ?? raw.player?.id ?? raw.playerId)
  const typeCode = normalizeEventTypeCode(raw)
  const typeRecord = (raw.type ?? raw.event_type ?? {}) as Record<string, unknown>
  const playerRecord = (raw.player ?? raw.player_info ?? raw.playerInfo ?? {}) as Record<
    string,
    unknown
  >
  const payloadRecord = (raw.payload as Record<string, unknown> | undefined) ?? undefined
  const teamId = [
    raw.team_id,
    raw.teamId,
    raw.team?.id,
    raw.home_team_id,
    raw.homeTeamId,
    raw.away_team_id,
    raw.awayTeamId,
    playerRecord.team_id,
    playerRecord.teamId,
    payloadRecord?.team_id,
    payloadRecord?.teamId,
    payloadRecord?.home_team_id,
    payloadRecord?.away_team_id
  ].map(asString).find(Boolean) ?? null
  let team: MatchSide | undefined
  if (teamId && homeTeamId && teamId === homeTeamId) team = 'home'
  if (teamId && awayTeamId && teamId === awayTeamId) team = 'away'
  if (!team) {
    const sideToken = asString(raw.side ?? raw.team_side ?? raw.teamSide ?? payloadRecord?.side ?? payloadRecord?.team_side)
    if (sideToken) {
      const normalizedSide = sideToken.toLowerCase()
      if (['home', 'mandante', 'local'].includes(normalizedSide)) {
        team = 'home'
      } else if (['away', 'visitante', 'visitor'].includes(normalizedSide)) {
        team = 'away'
      }
    }
  }
  const typeName = normalizeEventTypeLabel(typeCode, raw) ?? asString(typeRecord.name ?? typeRecord.label ?? raw.type_name)
  const playerName = resolvePersonName(playerRecord) ?? asString(raw.player_name)
  const fallbackDescription = [typeName, playerName].filter(Boolean).join(' - ') || 'Evento registrado'
  const description = asString(raw.description) ?? fallbackDescription
  const timestamp = asString(raw.created_at ?? raw.timestamp ?? raw.applied_at) ?? new Date().toISOString()
  const matchTimeSeconds = asNumber(raw.match_time_seconds ?? raw.matchTimeSeconds)
  const homeScore = resolveEventScore(raw, 'home')
  const awayScore = resolveEventScore(raw, 'away')
  const matchTimeLabel =
    typeof matchTimeSeconds === 'number'
      ? formatMatchTime(matchTimeSeconds)
      : undefined

  return {
    id,
    team,
    playerId: playerId ?? undefined,
    playerName,
    typeCode: typeCode ?? asString(raw.type) ?? undefined,
    typeName,
    description,
    timestamp,
    matchTimeSeconds: matchTimeSeconds ?? undefined,
    matchTimeLabel,
    homeScore: homeScore ?? undefined,
    awayScore: awayScore ?? undefined
  }
}

function formatMatchTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0')
  const secs = String(safe % 60).padStart(2, '0')
  return `${minutes}:${secs}`
}

function compareMatchControlEvents(a: MatchControlEvent, b: MatchControlEvent): number {
  if (typeof a.matchTimeSeconds === 'number' && typeof b.matchTimeSeconds === 'number') {
    if (a.matchTimeSeconds !== b.matchTimeSeconds) {
      return b.matchTimeSeconds - a.matchTimeSeconds
    }
  }

  const aTimestamp = Date.parse(a.timestamp)
  const bTimestamp = Date.parse(b.timestamp)
  if (Number.isFinite(aTimestamp) && Number.isFinite(bTimestamp) && aTimestamp !== bTimestamp) {
    return bTimestamp - aTimestamp
  }

  return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' })
}

export function sortMatchControlEvents(events: MatchControlEvent[]): MatchControlEvent[] {
  return [...events].sort(compareMatchControlEvents)
}

export function normalizeMatchDetail(payload: unknown): MatchControlDetail | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const id = asString(record.id)
  if (!id) return null
  const status = (asString(record.status) as MatchStatus) ?? 'scheduled'
  const homeTeamId = asString(record.home_team_id ?? record.homeTeamId)
  const awayTeamId = asString(record.away_team_id ?? record.awayTeamId)
  const homeScore =
    resolveEventScore(record, 'home') ??
    asNumber((record.score as Record<string, unknown> | undefined)?.home) ??
    0
  const awayScore =
    resolveEventScore(record, 'away') ??
    asNumber((record.score as Record<string, unknown> | undefined)?.away) ??
    0
  const competitionId = asString(record.competition_id ?? record.competitionId ?? (record.competition as Record<string, unknown> | undefined)?.id)
  const competitionSeasonId = asString(
    record.competition_season_id ??
      record.competitionSeasonId ??
      (record.competition_season as Record<string, unknown> | undefined)?.id ??
      (record.competition as Record<string, unknown> | undefined)?.season_id ??
      (record.competition as Record<string, unknown> | undefined)?.competition_season_id
  )
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
  const events = sortMatchControlEvents(rawEvents
    .map((event) => (event && typeof event === 'object' ? normalizeEvent(event as Record<string, unknown>, homeTeamId, awayTeamId) : null))
    .filter((event): event is MatchControlEvent => Boolean(event)))

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
    competitionSeasonId: competitionSeasonId ?? undefined,
    competitionSeason:
      asString((record.competition_season as Record<string, unknown> | undefined)?.label) ??
      asString(record.competition?.season ?? record.competition_season),
    naipe: resolveMatchNaipe(record),
    venueName: asString(record.venue?.name ?? record.venue_name),
    venueId: venueId ?? undefined,
    meta: (record.meta as Record<string, unknown> | undefined) ?? undefined,
    broadcastUrl: asString(record.broadcast_url ?? record.broadcastUrl),
    homeTeam,
    awayTeam,
    participants: { home: participantsHome, away: participantsAway },
    events
  }
}

export function normalizeMatchEvents(payload: unknown, homeTeamId?: string | null, awayTeamId?: string | null): MatchControlEvent[] {
  if (!Array.isArray(payload)) return []
  return sortMatchControlEvents(payload
    .map((item) => (item && typeof item === 'object' ? normalizeEvent(item as Record<string, unknown>, homeTeamId, awayTeamId) : null))
    .filter((event): event is MatchControlEvent => Boolean(event)))
}
