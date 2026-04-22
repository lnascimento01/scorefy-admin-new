'use client'

import { useCallback, useEffect, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { TeamsGateway } from '../services/teams.service'
import type { TeamFilters, TeamListMeta, TeamSummary } from '../types'

const DEFAULT_META: TeamListMeta = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }

const DEFAULT_FILTERS: TeamFilters = {
  search: '',
  countryId: '',
  sort: 'name',
  page: 1,
  perPage: 10,
}

export function useTeams() {
  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [meta, setMeta] = useState<TeamListMeta>(DEFAULT_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TeamFilters>(DEFAULT_FILTERS)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await TeamsGateway.list({
        page: filters.page,
        perPage: filters.perPage,
        search: filters.search,
        countryId: filters.countryId || undefined,
        sort: filters.sort,
      })
      setTeams(result.items)
      setMeta(result.meta)
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível carregar as equipes.'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTeams().catch(() => undefined)
  }, [fetchTeams])

  function updateFilter(patch: Partial<TeamFilters>) {
    setFilters((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? 1,
    }))
  }

  return {
    teams,
    meta,
    loading,
    error,
    filters,
    setSearch: (search: string) => updateFilter({ search }),
    setCountryId: (countryId: string) => updateFilter({ countryId }),
    setSort: (sort: TeamFilters['sort']) => updateFilter({ sort }),
    setPage: (page: number) => updateFilter({ page }),
    setPerPage: (perPage: number) => updateFilter({ perPage, page: 1 }),
    refetch: () => fetchTeams().catch(() => undefined),
  }
}
