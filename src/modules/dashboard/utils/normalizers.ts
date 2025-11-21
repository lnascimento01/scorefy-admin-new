import { DashboardOverview, MatchStatus, MatchSummary, TeamPerformanceDatum, WeeklyPerformanceDatum } from '../types'

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return null
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return null
}

export function normalizeOverview(payload: unknown): DashboardOverview | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const record = payload as Record<string, unknown>

  const resolve = (keys: string[]): number | null => {
    for (const key of keys) {
      if (!(key in record)) continue
      const value = asNumber(record[key])
      if (value !== null) return value
    }
    return null
  }

  const overview: DashboardOverview = {
    liveMatches: resolve(['live_matches', 'liveMatches', 'live']),
    activeUsers: resolve(['active_users', 'activeUsers']),
    averageGoals: resolve(['average_goals', 'averageGoals', 'average_goals_per_match_current_month']),
    victoryRate: resolve(['victory_rate', 'victoryRate', 'home_win_percentage_last_month'])
  }

  const hasValue = Object.values(overview).some((value) => value !== null)
  return hasValue ? overview : null
}

function normalizeStatus(value: unknown): MatchStatus | null {
  if (typeof value !== 'string') return null
  const normalized = value.toLowerCase() as MatchStatus
  const allowed: MatchStatus[] = ['scheduled', 'not_started', 'live', 'paused', 'halftime', 'final', 'finished', 'canceled']
  return allowed.includes(normalized) ? normalized : null
}

export function normalizeMatchSummary(payload: unknown): MatchSummary | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const status = normalizeStatus(record.status ?? record.match_status)
  const id = asString(record.id ?? record.uuid ?? record.slug)

  const homeEntity = (record.homeTeam ?? record.home_team) as Record<string, unknown> | undefined
  const awayEntity = (record.awayTeam ?? record.away_team) as Record<string, unknown> | undefined
  const homeTeam = asString(homeEntity?.name ?? record.home)
  const awayTeam = asString(awayEntity?.name ?? record.away)
  if (!id || !homeTeam || !awayTeam) return null

  const startAt = asString(record.start_at ?? record.startAt)
  const startDate = startAt ? new Date(startAt) : null
  const dateLabel = startDate && !Number.isNaN(startDate.getTime())
    ? startDate.toLocaleDateString('pt-BR')
    : asString(record.date) ?? asString(record.match_date) ?? '—'
  const timeLabel = startDate && !Number.isNaN(startDate.getTime())
    ? startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : asString(record.time) ?? asString(record.match_time) ?? '—'
  const competition = asString(record.competition?.name ?? record.competition_name ?? record.competition) ?? '—'
  const venue = asString(record.venue?.name ?? record.venue_name ?? record.meta?.venue)
  const homeScore = asNumber(record.home_score ?? homeEntity?.score)
  const awayScore = asNumber(record.away_score ?? awayEntity?.score)
  const score = typeof homeScore === 'number' && typeof awayScore === 'number'
    ? `${homeScore} x ${awayScore}`
    : asString(record.score) ?? '—'
  const metaSlug = asString(record.meta?.slug ?? record.slug)
  const homeShort = asString(homeEntity?.short_name ?? homeEntity?.shortName ?? record.homeTeamInfo?.shortName ?? record.home_team_short)
  const awayShort = asString(awayEntity?.short_name ?? awayEntity?.shortName ?? record.awayTeamInfo?.shortName ?? record.away_team_short)

  return {
    id,
    date: dateLabel,
    time: timeLabel,
    competition,
    venue: venue ?? undefined,
    homeTeam,
    awayTeam,
    homeShort: homeShort ?? undefined,
    awayShort: awayShort ?? undefined,
    score: score ?? '—',
    status: status ?? 'scheduled',
    metaSlug: metaSlug ?? undefined
  }
}

export function normalizeTeamPerformance(payload: unknown): TeamPerformanceDatum | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const team = asString(record.team ?? record.name)
  const goals = asNumber(record.goals ?? record.total_goals ?? record.goals_scored ?? record.goalsFor)
  const concededCandidate = asNumber(
    record.conceded ??
      record.suffered ??
      record.goals_conceded ??
      record.goalsAllowed ??
      record.goals_against ??
      record.goalsAgainst
  )
  if (!team || goals === null) {
    return null
  }
  return { team, goals, conceded: concededCandidate ?? 0 }
}

export function normalizeWeeklyPerformance(payload: unknown): WeeklyPerformanceDatum | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const label = asString(record.label ?? record.round ?? record.week)
  const goals = asNumber(record.goals ?? record.scored ?? record.goals_scored)
  const conceded = asNumber(record.conceded ?? record.against ?? record.goals_conceded)
  if (!label || goals === null || conceded === null) {
    return null
  }
  return { label, goals, conceded }
}

export function extractArray(payload: unknown, fallbackKey?: string): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  if (fallbackKey && Array.isArray((payload as Record<string, unknown>)[fallbackKey])) {
    return (payload as Record<string, unknown>)[fallbackKey] as unknown[]
  }
  if ('data' in (payload as Record<string, unknown>) && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data?: unknown[] }).data ?? []
  }
  const firstNestedArray = Object.values(payload as Record<string, unknown>).find((value) =>
    Array.isArray(value)
  )
  if (Array.isArray(firstNestedArray)) {
    return firstNestedArray as unknown[]
  }
  return []
}
