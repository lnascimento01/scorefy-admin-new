import type {
  DashboardSnapshot,
  MatchSummary,
  TeamPerformanceDatum,
  WeeklyPerformanceDatum
} from '../types'

const mockOverview = {
  liveMatches: 4,
  activeUsers: 28,
  averageGoals: 27.4,
  victoryRate: 58
}

const mockTeamPerformance: TeamPerformanceDatum[] = [
  { team: 'Handebol Cascavel', goals: 42, conceded: 28 },
  { team: 'Blumenau HC', goals: 37, conceded: 31 },
  { team: 'São Paulo Wolves', goals: 34, conceded: 25 },
  { team: 'Minas Foxes', goals: 31, conceded: 29 },
  { team: 'Recife Atlas', goals: 28, conceded: 33 }
]

const mockWeeklyPerformance: WeeklyPerformanceDatum[] = [
  { label: 'Rodada 5', goals: 62, conceded: 55 },
  { label: 'Rodada 6', goals: 68, conceded: 52 },
  { label: 'Rodada 7', goals: 64, conceded: 59 },
  { label: 'Rodada 8', goals: 72, conceded: 61 },
  { label: 'Rodada 9', goals: 70, conceded: 58 }
]

const mockMatches: MatchSummary[] = [
  {
    id: 'mock-1',
    date: '12/03',
    time: '19:30',
    competition: 'Liga Nacional',
    venue: 'Ginásio Tarumã',
    homeTeam: 'Handebol Cascavel',
    awayTeam: 'São Paulo Wolves',
    score: '32 x 29',
    status: 'final',
    metaSlug: 'lnb-2024'
  },
  {
    id: 'mock-2',
    date: '12/03',
    time: '21:00',
    competition: 'Liga Nacional',
    venue: 'CEPEUSP',
    homeTeam: 'Blumenau HC',
    awayTeam: 'Minas Foxes',
    score: '27 x 27',
    status: 'live',
    metaSlug: 'lnb-2024'
  },
  {
    id: 'mock-3',
    date: '13/03',
    time: '18:00',
    competition: 'Copa Sul',
    venue: 'Arena Multiuso',
    homeTeam: 'Recife Atlas',
    awayTeam: 'Fortaleza Storm',
    score: '18 x 21',
    status: 'finished'
  },
  {
    id: 'mock-4',
    date: '13/03',
    time: '20:15',
    competition: 'Copa Sul',
    venue: 'Arena Multiuso',
    homeTeam: 'Rio Sharks',
    awayTeam: 'Campinas Blaze',
    score: '25 x 25',
    status: 'paused'
  },
  {
    id: 'mock-5',
    date: '14/03',
    time: '17:00',
    competition: 'Liga Nacional',
    venue: 'Arena Recife',
    homeTeam: 'Porto Alegre Lynx',
    awayTeam: 'Curitiba Flames',
    score: '—',
    status: 'scheduled'
  },
  {
    id: 'mock-6',
    date: '14/03',
    time: '19:00',
    competition: 'Liga Nacional',
    venue: 'São José dos Campos',
    homeTeam: 'Brasília Royals',
    awayTeam: 'Manaus Tide',
    score: '—',
    status: 'scheduled'
  }
]

export function createDashboardMock(): DashboardSnapshot {
  return {
    overview: mockOverview,
    teamPerformance: mockTeamPerformance,
    weeklyPerformance: mockWeeklyPerformance,
    latestMatches: mockMatches
  }
}
