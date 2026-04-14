'use client'

import { useCallback, useEffect, useState } from 'react'
import { CompetitionsGateway } from '../services/competitions.service'
import type {
  Competition,
  CompetitionListMeta,
  CompetitionNaipe,
  CompetitionScope,
  CompetitionSort,
} from '../types'

const DEFAULT_META: CompetitionListMeta = { currentPage: 1, lastPage: 1, perPage: 20, total: 0 }

interface CompetitionFiltersState {
  q: string
  scope: CompetitionScope | 'all'
  typeId: string
  countryId: string
  naipe: CompetitionNaipe | 'all'
  category: string
  sort: CompetitionSort
  page: number
  perPage: number
}

const DEFAULT_FILTERS: CompetitionFiltersState = {
  q: '',
  scope: 'all',
  typeId: '',
  countryId: '',
  naipe: 'all',
  category: '',
  sort: 'name',
  page: 1,
  perPage: 20,
}

export function useCompetitions() {
  const [items, setItems] = useState<Competition[]>([])
  const [meta, setMeta] = useState<CompetitionListMeta>(DEFAULT_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api'>('api')
  const [filters, setFilters] = useState<CompetitionFiltersState>(DEFAULT_FILTERS)

  const fetchCompetitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await CompetitionsGateway.list({
        q: filters.q,
        scope: filters.scope === 'all' ? undefined : filters.scope,
        typeId: filters.typeId || undefined,
        countryId: filters.countryId || undefined,
        naipe: filters.naipe === 'all' ? undefined : filters.naipe,
        category: filters.category,
        sort: filters.sort,
        page: filters.page,
        perPage: filters.perPage,
      })
      setItems(result.items)
      setMeta(result.meta)
      setSource(result.source)
    } catch (err) {
      console.error('Failed to load competitions', err)
      setError('Não foi possível carregar competições.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchCompetitions().catch(() => undefined)
  }, [fetchCompetitions])

  const updateFilter = useCallback((patch: Partial<CompetitionFiltersState>) => {
    setFilters((prev) => {
      const nextPage =
        patch.page ??
        (Object.keys(patch).some((key) => key !== 'page') ? 1 : prev.page)

      return {
        ...prev,
        ...patch,
        page: nextPage,
      }
    })
  }, [])

  return {
    competitions: items,
    meta,
    loading,
    error,
    source,
    filters,
    setSearch: (q: string) => updateFilter({ q }),
    setScope: (scope: CompetitionScope | 'all') => updateFilter({ scope }),
    setTypeId: (typeId: string) => updateFilter({ typeId }),
    setCountryId: (countryId: string) => updateFilter({ countryId }),
    setNaipe: (naipe: CompetitionNaipe | 'all') => updateFilter({ naipe }),
    setCategory: (category: string) => updateFilter({ category }),
    setSort: (sort: CompetitionSort) => updateFilter({ sort }),
    setPage: (page: number) => updateFilter({ page }),
    setPerPage: (perPage: number) => updateFilter({ perPage }),
    refetch: () => fetchCompetitions().catch(() => undefined),
  }
}
