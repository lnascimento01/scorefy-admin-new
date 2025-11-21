import type { ComponentType } from 'react'
import type { MatchStatus } from '@/modules/matches/types'

export type MatchSide = 'home' | 'away'

export interface MatchControlTeamInfo {
  id: string
  name: string
  shortName?: string
  slug?: string
  city?: string | null
  colors?: {
    primary?: string
    secondary?: string
  }
  score: number
}

export interface MatchControlParticipant {
  id: string
  name: string
  nick: string
  shirtNumber?: number
  role?: string
  position?: string
  team: MatchSide
  isStaff?: boolean
}

export interface MatchControlEvent {
  id: string
  team?: MatchSide
  playerName?: string
  typeName?: string
  description: string
  timestamp: string
  matchTimeLabel?: string
}

export interface MatchControlDetail {
  id: string
  status: MatchStatus
  period?: number
  startAt?: string
  competitionName?: string
  competitionId?: string
  competitionSeason?: string
  venueName?: string
  venueId?: string
  broadcastUrl?: string | null
  homeTeam: MatchControlTeamInfo
  awayTeam: MatchControlTeamInfo
  events: MatchControlEvent[]
  participants: {
    home: MatchControlParticipant[]
    away: MatchControlParticipant[]
  }
}

export interface MatchQuickAction {
  id: string
  label: string
  description?: string
  hotkey?: string
  tone?: 'primary' | 'info' | 'danger' | 'neutral'
  team: MatchSide | 'both'
  icon?: ComponentType<{ className?: string }>
  typeCode: string
  requiresPlayer?: boolean
}
