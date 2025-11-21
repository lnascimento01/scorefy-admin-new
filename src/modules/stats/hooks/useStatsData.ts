'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardGateway } from '@/modules/dashboard/services/dashboard.service'
import type { DashboardOverview, TeamPerformanceDatum, WeeklyPerformanceDatum } from '@/modules/dashboard/types'

const EMPTY_OVERVIEW: DashboardOverview = {
  liveMatches: null,
  activeUsers: null,
  averageGoals: null,
  victoryRate: null
}

export function useStatsData() {
  const [overview, setOverview] = useState<DashboardOverview>(EMPTY_OVERVIEW)
  const [topScoringTeams, setTopScoringTeams] = useState<TeamPerformanceDatum[]>([])
  const [goalsByRound, setGoalsByRound] = useState<WeeklyPerformanceDatum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState('api')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, source: dataSource } = await DashboardGateway.fetchSnapshot()
      setOverview(data.overview)
      setTopScoringTeams(data.teamPerformance)
      setGoalsByRound(data.weeklyPerformance)
      setSource(dataSource)
    } catch (err) {
      console.error('Failed to load stats', err)
      setError('Não foi possível sincronizar estatísticas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats().catch(() => undefined)
  }, [fetchStats])

  return {
    overview,
    topScoringTeams,
    goalsByRound,
    loading,
    error,
    source,
    refetch: () => fetchStats().catch(() => undefined)
  }
}
