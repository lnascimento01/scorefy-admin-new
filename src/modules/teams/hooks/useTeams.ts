'use client'

import { useCallback, useEffect, useState } from 'react'
import { TeamsGateway } from '../services/teams.service'
import type { TeamSummary, TeamListMeta, TeamStatus } from '../types'

const DEFAULT_META: TeamListMeta = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }

export function useTeams() {
  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [meta, setMeta] = useState<TeamListMeta>(DEFAULT_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('api')
  const [filters, setFilters] = useState<{
    status: TeamStatus | 'all'
    category: string | 'all'
    gender: string | 'all'
    search: string
    page: number
    perPage: number
  }>({
    status: 'all',
    category: 'all',
    gender: 'all',
    search: '',
    page: 1,
    perPage: 10
  })

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await TeamsGateway.list({
        page: filters.page,
        perPage: filters.perPage,
        search: filters.search,
        status: filters.status,
        category: filters.category === 'all' ? undefined : filters.category,
        gender: filters.gender === 'all' ? undefined : filters.gender
      })
      setTeams(result.items)
      setMeta(result.meta)
      setSource(result.source)
    } catch (err) {
      console.error('Failed to load teams', err)
      setError('Não foi possível carregar as equipes.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTeams().catch(() => undefined)
  }, [fetchTeams])

  const updateFilter = (patch: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  return {
    teams,
    meta,
    loading,
    error,
    source,
    filters,
    setStatus: (status: TeamStatus | 'all') => updateFilter({ status }),
    setCategory: (category: string | 'all') => updateFilter({ category }),
    setGender: (gender: string | 'all') => updateFilter({ gender }),
    setSearch: (search: string) => updateFilter({ search }),
    setPage: (page: number) => updateFilter({ page }),
    setPerPage: (perPage: number) => updateFilter({ perPage, page: 1 }),
    refetch: () => fetchTeams().catch(() => undefined)
  }
}
