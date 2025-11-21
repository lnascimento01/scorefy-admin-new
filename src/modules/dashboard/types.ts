export type MatchStatus =
  | 'scheduled'
  | 'not_started'
  | 'live'
  | 'paused'
  | 'halftime'
  | 'final'
  | 'finished'
  | 'canceled'

export interface DashboardOverview {
  liveMatches: number | null
  activeUsers: number | null
  averageGoals: number | null
  victoryRate: number | null
}

export interface TeamPerformanceDatum {
  team: string
  goals: number
  conceded: number
}

export interface WeeklyPerformanceDatum {
  label: string
  goals: number
  conceded: number
}

export interface MatchSummary {
  id: string
  date: string
  time: string
  competition: string
  venue?: string
  homeTeam: string
  awayTeam: string
  homeShort?: string
  awayShort?: string
  score: string
  status: MatchStatus
  metaSlug?: string
}

export interface DashboardSnapshot {
  overview: DashboardOverview
  teamPerformance: TeamPerformanceDatum[]
  weeklyPerformance: WeeklyPerformanceDatum[]
  latestMatches: MatchSummary[]
}

export type DashboardDataSource = 'api' | 'mock' | 'partial'

export type DashboardAlertType = 'overview' | 'charts' | 'matches' | 'mock' | 'partial' | 'network'

export interface DashboardSnapshotResult {
  data: DashboardSnapshot
  source: DashboardDataSource
  alerts: DashboardAlertType[]
}
