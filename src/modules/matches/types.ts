export type MatchStatus =
  | 'scheduled'
  | 'not_started'
  | 'live'
  | 'paused'
  | 'halftime'
  | 'final'
  | 'finished'
  | 'canceled'

export interface MatchSummary {
  id: string
  status: MatchStatus
  dateLabel: string
  timeLabel: string
  competitionName: string
  competitionId?: string
  competitionSeason?: string
  venue?: string
  home: { name: string; short?: string }
  away: { name: string; short?: string }
  scoreLabel: string
  metaSlug?: string
  homeScore?: number
  awayScore?: number
}

export interface MatchListMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface MatchListFilters {
  page?: number
  perPage?: number
  search?: string
  status?: MatchStatus | 'all'
  competitionId?: string
  date?: string
}

export interface MatchListResult {
  data: MatchSummary[]
  meta: MatchListMeta
  errorMessage?: string
  lastSync?: string
}

export interface MatchControlTeamSnapshot {
  id?: string
  name?: string
  shortName?: string
  score: number
}

export interface MatchControlSnapshot {
  matchId: string
  status: MatchStatus
  period?: number
  elapsedSeconds: number
  periodElapsedSeconds?: number
  serverTime?: string
  startTime?: string
  lastPauseAt?: string
  lastEventAt?: string
  maxPeriodSeconds?: number
  firstHalfEnd?: number
  home: MatchControlTeamSnapshot
  away: MatchControlTeamSnapshot
}

export interface MatchCreatePayload {
  competitionId: string
  homeTeamId: string
  awayTeamId: string
  startAt: string
  venueId?: string
}

export interface MatchUpdatePlayersPayload {
  addPlayerIds?: string[]
  removePlayerIds?: string[]
}

export interface MatchUpdatePayload {
  competitionId?: string
  homeTeamId?: string
  awayTeamId?: string
  startAt?: string
  venueId?: string | null
}
