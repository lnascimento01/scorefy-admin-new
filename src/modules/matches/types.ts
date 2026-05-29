import type { CompetitionNaipe } from '@/modules/competitions/types'

export type MatchStatus =
  | 'scheduled'
  | 'not_started'
  | 'live'
  | 'paused'
  | 'halftime'
  | 'final'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'canceled'

export interface MatchSummary {
  id: string
  status: MatchStatus
  dateLabel: string
  timeLabel: string
  competitionName: string
  competitionId?: string
  competitionSeasonId?: string
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
  competitionSeasonId?: string
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
  statusLabel?: string
  periodLabel?: string
  showScore?: boolean
  showClock?: boolean
  elapsedSeconds: number
  periodElapsedSeconds?: number
  serverTime?: string
  startTime?: string
  lastPauseAt?: string
  lastEventAt?: string
  timeoutRemainingSeconds?: number
  maxPeriodSeconds?: number
  firstHalfEnd?: number
  meta?: Record<string, unknown>
  home: MatchControlTeamSnapshot
  away: MatchControlTeamSnapshot
}

export interface MatchCreatePayload {
  competitionSeasonId: string
  naipe?: CompetitionNaipe
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
  competitionSeasonId?: string
  naipe?: CompetitionNaipe | null
  homeTeamId?: string
  awayTeamId?: string
  startAt?: string
  venueId?: string | null
  broadcastUrl?: string | null
}
