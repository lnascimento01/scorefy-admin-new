'use client'

import { useCallback, useEffect, useState } from 'react'
import { CompetitionsGateway } from '../services/competitions.service'
import type { CompetitionListMeta, CompetitionSummary } from '../types'

const DEFAULT_META: CompetitionListMeta = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }

export function useCompetitions() {
  const [items, setItems] = useState<CompetitionSummary[]>([])
  const [meta, setMeta] = useState<CompetitionListMeta>(DEFAULT_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('api')

  const fetchCompetitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await CompetitionsGateway.list()
      setItems(result.items)
      setMeta(result.meta)
      setSource(result.source)
    } catch (err) {
      console.error('Failed to load competitions', err)
      setError('Não foi possível carregar competições.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompetitions().catch(() => undefined)
  }, [fetchCompetitions])

  return {
    competitions: items,
    meta,
    loading,
    error,
    source,
    refetch: () => fetchCompetitions().catch(() => undefined)
  }
}
