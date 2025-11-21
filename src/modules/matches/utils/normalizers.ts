import { MatchControlSnapshot, MatchStatus, MatchSummary } from '../types'

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit'
})

function asString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return null
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function formatDateTime(value: unknown) {
  const asStringValue = asString(value)
  if (!asStringValue) return { dateLabel: '—', timeLabel: '—' }
  const parsed = new Date(asStringValue)
  if (Number.isNaN(parsed.getTime())) {
    return {
      dateLabel: asStringValue,
      timeLabel: '—'
    }
  }
  return {
    dateLabel: DATE_FORMATTER.format(parsed),
    timeLabel: TIME_FORMATTER.format(parsed)
  }
}

export function normalizeMatchSummary(payload: unknown): MatchSummary | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const id = asString(record.id)
  const status = (asString(record.status) as MatchStatus) ?? 'scheduled'

  const homeTeam = (record.home_team ?? record.homeTeam) as Record<string, unknown> | undefined
  const awayTeam = (record.away_team ?? record.awayTeam) as Record<string, unknown> | undefined

  const homeName = asString(homeTeam?.name ?? record.home)
  const awayName = asString(awayTeam?.name ?? record.away)
  if (!id || !homeName || !awayName) return null

  const { dateLabel, timeLabel } = formatDateTime(record.start_at ?? record.date)
  const competition = (record.competition ?? {}) as Record<string, unknown>
  const competitionId = asString(competition.id ?? record.competition_id)
  const competitionName = asString(competition.name ?? record.competition_name) ?? 'Competição indefinida'
  const competitionSeason = asString(competition.season)
  const venue = asString((record.venue as Record<string, unknown> | undefined)?.name ?? record.venue_name)
  const homeScore = asNumber(record.home_score ?? homeTeam?.score)
  const awayScore = asNumber(record.away_score ?? awayTeam?.score)
  const metaSlug = asString((record.meta as Record<string, unknown> | undefined)?.slug)

  return {
    id,
    status,
    dateLabel,
    timeLabel,
    competitionName,
    competitionId: competitionId ?? undefined,
    competitionSeason: competitionSeason ?? undefined,
    venue: venue ?? undefined,
    home: {
      name: homeName,
      short: asString(homeTeam?.short_name ?? homeTeam?.shortName)
    },
    away: {
      name: awayName,
      short: asString(awayTeam?.short_name ?? awayTeam?.shortName)
    },
    scoreLabel:
      typeof homeScore === 'number' && typeof awayScore === 'number'
        ? `${homeScore} x ${awayScore}`
        : asString(record.score) ?? '—',
    homeScore: homeScore ?? undefined,
    awayScore: awayScore ?? undefined,
    metaSlug: metaSlug ?? undefined
  }
}

export function normalizeMatchControlSnapshot(payload: unknown): MatchControlSnapshot | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const matchId = asString(record.match_id ?? record.matchId ?? record.id)
  const status = asString(record.status) as MatchStatus | null

  if (!matchId || !status) {
    return null
  }

  const score = (record.score ?? {}) as Record<string, unknown>
  const teamsRecord = (record.teams ?? {}) as Record<string, unknown>
  const homeTeam = teamsRecord.home as Record<string, unknown> | undefined
  const awayTeam = teamsRecord.away as Record<string, unknown> | undefined

  const buildTeamSnapshot = (
    team: Record<string, unknown> | undefined,
    fallbackName: string,
    scoreValue: unknown
  ): MatchControlSnapshot['home'] => ({
    id: asString(team?.id) ?? undefined,
    name: asString(team?.name) ?? fallbackName,
    shortName: asString(team?.short_name ?? team?.shortName) ?? undefined,
    score: asNumber(scoreValue) ?? 0
  })

  const snapshot: MatchControlSnapshot = {
    matchId,
    status,
    period: asNumber(record.period) ?? undefined,
    elapsedSeconds: asNumber(record.elapsed_seconds ?? record.elapsedSeconds) ?? 0,
    periodElapsedSeconds: asNumber(record.period_elapsed_seconds ?? record.periodElapsedSeconds) ?? undefined,
    serverTime: asString(record.server_time ?? record.serverTime) ?? undefined,
    startTime: asString(record.start_time ?? record.startTime) ?? undefined,
    lastPauseAt: asString(record.last_pause_started_at ?? record.lastPauseStartedAt) ?? undefined,
    lastEventAt: asString(record.last_event_at ?? record.lastEventAt) ?? undefined,
    maxPeriodSeconds: asNumber(record.MAX_PERIOD_SECONDS ?? record.max_period_seconds ?? record.maxPeriodSeconds) ?? undefined,
    firstHalfEnd: asNumber(record.FIRST_HALF_END ?? record.first_half_end ?? record.firstHalfEnd) ?? undefined,
    home: buildTeamSnapshot(homeTeam, 'Mandante', score.home ?? record.home_score),
    away: buildTeamSnapshot(awayTeam, 'Visitante', score.away ?? record.away_score)
  }

  return snapshot
}
