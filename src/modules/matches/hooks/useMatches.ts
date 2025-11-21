'use client'

import { useCallback, useEffect, useState } from 'react'
import { MatchesGateway } from '../services/matches.service'
import { MatchListFilters, MatchListMeta, MatchListResult, MatchStatus } from '../types'

const DEFAULT_META: MatchListMeta = {
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  total: 0
}

interface UseMatchesOptions {
  initialFilters?: MatchListFilters
}

export function useMatches({ initialFilters }: UseMatchesOptions = {}) {
  const [filters, setFilters] = useState<MatchListFilters>({ page: 1, perPage: 10, status: 'all', ...initialFilters })
  const [data, setData] = useState<MatchListResult>({ data: [], meta: DEFAULT_META })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(
    async (override?: Partial<MatchListFilters>) => {
      const nextFilters = { ...filters, ...override }
      setFilters(nextFilters)
      setLoading(true)
      setError(null)
      try {
        const result = await MatchesGateway.list(nextFilters)
        setData(result)
      } catch (err) {
        console.error('Failed to load matches', err)
        setError('Não foi possível carregar as partidas.')
      } finally {
        setLoading(false)
      }
    },
    [filters],
  )

  useEffect(() => {
    fetchMatches().catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateFilter = (patch: Partial<MatchListFilters>) => {
    fetchMatches({ page: 1, ...patch }).catch(() => undefined)
  }

  return {
    matches: data.data,
    meta: data.meta,
    lastSync: data.lastSync,
    loading,
    error,
    filters,
    setStatusFilter: (status: MatchStatus | 'all') => updateFilter({ status }),
    setCompetitionFilter: (competitionId: string) => updateFilter({ competitionId }),
    setDateFilter: (date?: string) => updateFilter({ date: date || undefined }),
    setSearchFilter: (search?: string) => updateFilter({ search }),
    setPage: (page: number) => fetchMatches({ page }).catch(() => undefined),
    setPerPage: (perPage: number) => fetchMatches({ perPage, page: 1 }).catch(() => undefined),
    refetch: () => fetchMatches().catch(() => undefined)
  }
}
