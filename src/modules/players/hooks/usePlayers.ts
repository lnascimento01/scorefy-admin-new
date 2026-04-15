'use client'

import { useCallback, useEffect, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { PlayersGateway } from '../services/players.service'
import type { PlayerListMeta, PlayerSummary } from '../types'

const DEFAULT_META: PlayerListMeta = { currentPage: 1, lastPage: 1, perPage: 20, total: 0 }
const DEBOUNCE_MS = 300

export function usePlayers() {
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [meta, setMeta] = useState<PlayerListMeta>(DEFAULT_META)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source] = useState<'api'>('api')
  const [filters, setFilters] = useState({
    q: '',
    teamId: 'all',
    status: 'all' as 'all' | 'active' | 'inactive',
    page: 1,
    perPage: 20,
  })
  const [debouncedSearch, setDebouncedSearch] = useState(filters.q)

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(filters.q)
    }, DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [filters.q])

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await PlayersGateway.list({
        q: debouncedSearch || undefined,
        teamId: filters.teamId === 'all' ? undefined : filters.teamId,
        isActive:
          filters.status === 'all'
            ? undefined
            : filters.status === 'active',
        page: filters.page,
        perPage: filters.perPage,
      })

      setPlayers(response.items)
      setMeta(response.meta)
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível carregar os atletas.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filters.page, filters.perPage, filters.status, filters.teamId])

  useEffect(() => {
    fetchPlayers().catch(() => undefined)
  }, [fetchPlayers])

  return {
    players,
    meta,
    filters,
    loading,
    error,
    source,
    setSearch: (q: string) => setFilters((current) => ({ ...current, q, page: 1 })),
    setTeamId: (teamId: string) => setFilters((current) => ({ ...current, teamId, page: 1 })),
    setStatus: (status: 'all' | 'active' | 'inactive') => setFilters((current) => ({ ...current, status, page: 1 })),
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    setPerPage: (perPage: number) => setFilters((current) => ({ ...current, perPage, page: 1 })),
    refetch: () => fetchPlayers().catch(() => undefined),
  }
}
