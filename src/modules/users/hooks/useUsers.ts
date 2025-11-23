'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { UsersGateway, type UsersListParams, type UsersListResponse } from '@/services/user.service'

const DEBOUNCE_MS = 300

type Source = 'api'

export function useUsers() {
  const [data, setData] = useState<UsersListResponse>({ items: [], meta: { currentPage: 1, lastPage: 1, perPage: 30, total: 0 } })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source] = useState<Source>('api')

  const [filters, setFilters] = useState<UsersListParams>({
    q: '',
    sort: 'name',
    page: 1,
    perPage: 30
  })

  // Debounced search term to avoid excessive requests while typing
  const [debouncedSearch, setDebouncedSearch] = useState(filters.q ?? '')

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(filters.q ?? '')
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filters.q])

  const fetchUsers = useCallback(
    async (params: UsersListParams) => {
      setLoading(true)
      setError(null)
      try {
        const response = await UsersGateway.list(params)
        setData(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os usuários.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchUsers({ ...filters, q: debouncedSearch })
  }, [debouncedSearch, fetchUsers, filters.page, filters.perPage, filters.sort])

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, q: value, page: 1 }))
  }, [])

  const setSort = useCallback((value: UsersListParams['sort']) => {
    setFilters((prev) => ({ ...prev, sort: value, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const setPerPage = useCallback((perPage: number) => {
    setFilters((prev) => ({ ...prev, perPage, page: 1 }))
  }, [])

  const meta = useMemo(() => data.meta, [data.meta])

  return {
    users: data.items,
    meta,
    filters,
    loading,
    error,
    source,
    setSearch,
    setSort,
    setPage,
    setPerPage,
    refetch: () => fetchUsers({ ...filters, q: debouncedSearch })
  }
}
