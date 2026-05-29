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

function resolveScore(record: Record<string, unknown>, side: 'home' | 'away'): number | null {
  const scoreRecord = (record.score as Record<string, unknown> | undefined) ?? undefined
  const teamsRecord = (record.teams as Record<string, unknown> | undefined) ?? undefined
  const nestedTeam = (side === 'home' ? teamsRecord?.home : teamsRecord?.away) as Record<string, unknown> | undefined

  const candidates = side === 'home'
    ? [
        record.home_score,
        record.homeScore,
        record.score_home,
        scoreRecord?.home,
        scoreRecord?.homeScore,
        nestedTeam?.score,
      ]
    : [
        record.away_score,
        record.awayScore,
        record.score_away,
        scoreRecord?.away,
        scoreRecord?.awayScore,
        nestedTeam?.score,
      ]

  for (const candidate of candidates) {
    const parsed = asNumber(candidate)
    if (typeof parsed === 'number') return parsed
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
  const competitionSeasonId = asString(
    competition.season_id ??
      competition.competition_season_id ??
      record.competition_season_id ??
      record.competitionSeasonId
  )
  const competitionSeason = asString(competition.season ?? record.competition_season)
  const venue = asString((record.venue as Record<string, unknown> | undefined)?.name ?? record.venue_name)
  const homeScore = resolveScore(record, 'home') ?? asNumber(homeTeam?.score)
  const awayScore = resolveScore(record, 'away') ?? asNumber(awayTeam?.score)
  const metaSlug = asString((record.meta as Record<string, unknown> | undefined)?.slug)

  return {
    id,
    status,
    dateLabel,
    timeLabel,
    competitionName,
    competitionId: competitionId ?? undefined,
    competitionSeasonId: competitionSeasonId ?? undefined,
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
    statusLabel: asString(record.status_label ?? record.statusLabel) ?? undefined,
    periodLabel: asString(record.period_label ?? record.periodLabel) ?? undefined,
    showScore: typeof record.show_score === 'boolean' ? record.show_score : typeof record.showScore === 'boolean' ? record.showScore : undefined,
    showClock: typeof record.show_clock === 'boolean' ? record.show_clock : typeof record.showClock === 'boolean' ? record.showClock : undefined,
    elapsedSeconds: asNumber(record.elapsed_seconds ?? record.elapsedSeconds) ?? 0,
    periodElapsedSeconds: asNumber(record.period_elapsed_seconds ?? record.periodElapsedSeconds) ?? undefined,
    serverTime: asString(record.server_time ?? record.serverTime) ?? undefined,
    startTime: asString(record.start_time ?? record.startTime) ?? undefined,
    lastPauseAt: asString(record.last_pause_started_at ?? record.lastPauseStartedAt) ?? undefined,
    lastEventAt: asString(record.last_event_at ?? record.lastEventAt) ?? undefined,
    timeoutRemainingSeconds: asNumber(record.timeout_remaining_seconds ?? record.timeoutRemainingSeconds) ?? undefined,
    maxPeriodSeconds: asNumber(record.MAX_PERIOD_SECONDS ?? record.max_period_seconds ?? record.maxPeriodSeconds) ?? undefined,
    firstHalfEnd: asNumber(record.FIRST_HALF_END ?? record.first_half_end ?? record.firstHalfEnd) ?? undefined,
    home: buildTeamSnapshot(homeTeam, 'Mandante', resolveScore(record, 'home') ?? score.home ?? record.home_score),
    away: buildTeamSnapshot(awayTeam, 'Visitante', resolveScore(record, 'away') ?? score.away ?? record.away_score)
  }

  return snapshot
}
