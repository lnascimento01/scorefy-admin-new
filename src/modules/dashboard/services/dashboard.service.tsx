import { getApi } from '@/services/api'
import { createDashboardMock } from '../data/mock'
import {
  DashboardAlertType,
  DashboardDataSource,
  DashboardSnapshotResult
} from '../types'
import {
  extractArray,
  normalizeMatchSummary,
  normalizeOverview,
  normalizeTeamPerformance,
  normalizeWeeklyPerformance
} from '../utils/normalizers'

const DASHBOARD_BASE = process.env.NEXT_PUBLIC_DASHBOARD_BASE_PATH ?? '/v1/auth'
const DASHBOARD_OVERVIEW_PATH =
  process.env.NEXT_PUBLIC_DASHBOARD_OVERVIEW_PATH ?? `${DASHBOARD_BASE}/overview`
const DASHBOARD_METRICS_PATH =
  process.env.NEXT_PUBLIC_DASHBOARD_METRICS_PATH ?? `${DASHBOARD_BASE}/admin/dashboard/metrics`
const DASHBOARD_MATCHES_PATH =
  process.env.NEXT_PUBLIC_DASHBOARD_MATCHES_PATH ?? `${DASHBOARD_BASE}/matches`

function pushAlert(alerts: DashboardAlertType[], type: DashboardAlertType) {
  if (alerts.includes(type)) return
  alerts.push(type)
}

export const DashboardGateway = {
  async fetchSnapshot(): Promise<DashboardSnapshotResult> {
    const fallback = createDashboardMock()
    const snapshot = {
      overview: { ...fallback.overview },
      teamPerformance: [...fallback.teamPerformance],
      weeklyPerformance: [...fallback.weeklyPerformance],
      latestMatches: [...fallback.latestMatches]
    }

    const alerts: DashboardAlertType[] = []
    const sectionsFetched = {
      overview: false,
      charts: false,
      matches: false
    }

    try {
      const api = await getApi()

      await Promise.allSettled([
        (async () => {
          try {
            const response = await api.get(DASHBOARD_OVERVIEW_PATH)
            const overview = normalizeOverview(response.data ?? response)
            if (overview) {
              snapshot.overview = overview
              sectionsFetched.overview = true
            } else {
              pushAlert(alerts, 'overview')
            }
          } catch (error) {
            console.warn('Dashboard overview unavailable', error)
            pushAlert(alerts, 'overview')
          }
        })(),
        (async () => {
          try {
            const response = await api.get(DASHBOARD_METRICS_PATH)
            const root = response.data ?? {}
            const overview = normalizeOverview(root.overview ?? root)
            if (overview) {
              snapshot.overview = overview
              sectionsFetched.overview = true
            } else {
              pushAlert(alerts, 'overview')
            }

            const teamPerformance = extractArray(root.top_scoring_teams ?? root.topScoringTeams)
              .map((item) => normalizeTeamPerformance(item))
              .filter(Boolean)
            const weeklyPerformance = extractArray(root.goals_by_round ?? root.goalsByRound)
              .map((item) => normalizeWeeklyPerformance(item))
              .filter(Boolean)

            if (teamPerformance.length) {
              snapshot.teamPerformance = teamPerformance as typeof snapshot.teamPerformance
            }
            if (weeklyPerformance.length) {
              snapshot.weeklyPerformance = weeklyPerformance as typeof snapshot.weeklyPerformance
            }

            if (teamPerformance.length || weeklyPerformance.length) {
              sectionsFetched.charts = true
            } else {
              pushAlert(alerts, 'charts')
            }
          } catch (error) {
            console.warn('Dashboard metrics unavailable', error)
            pushAlert(alerts, 'charts')
          }
        })(),
        (async () => {
          try {
            const response = await api.get(DASHBOARD_MATCHES_PATH, {
              params: { per_page: 6, perPage: 6 }
            })
            const payload = response.data ?? response
            const record =
              payload && typeof payload === 'object'
                ? (payload as Record<string, unknown>)
                : {}
            const candidates = extractArray(record.data)
              .concat(extractArray(record.matches))
              .concat(Array.isArray(payload) ? (payload as unknown[]) : [])
            const matchesSource = candidates.length ? candidates : extractArray(payload)
            const matches = matchesSource
              .map((item) => normalizeMatchSummary(item))
              .filter(Boolean)
              .slice(0, 6)

            if (matches.length) {
              snapshot.latestMatches = matches as typeof snapshot.latestMatches
              sectionsFetched.matches = true
            } else {
              pushAlert(alerts, 'matches')
            }
          } catch (error) {
            console.warn('Latest matches unavailable', error)
            pushAlert(alerts, 'matches')
          }
        })()
      ])
    } catch (error) {
      console.error('Dashboard snapshot failed entirely', error)
      pushAlert(alerts, 'network')
      pushAlert(alerts, 'mock')
      return { data: snapshot, source: 'mock', alerts }
    }

    const successCount = Object.values(sectionsFetched).filter(Boolean).length
    let source: DashboardDataSource = 'mock'
    if (successCount === Object.keys(sectionsFetched).length) {
      source = 'api'
    } else if (successCount > 0) {
      source = 'partial'
    }

    if (source === 'partial') {
      pushAlert(alerts, 'partial')
    }
    if (source === 'mock' && !alerts.includes('mock')) {
      pushAlert(alerts, 'mock')
    }

    return { data: snapshot, source, alerts }
  }
}
