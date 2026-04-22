'use client'

import { useCallback, useEffect, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { TeamsGateway } from '../services/teams.service'
import type { TeamCountry } from '../types'

export function useTeamCatalogs() {
  const [countries, setCountries] = useState<TeamCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCatalogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [countriesData] = await Promise.all([TeamsGateway.listCountries()])
      setCountries(countriesData)
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível carregar os catálogos de equipes.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalogs().catch(() => undefined)
  }, [fetchCatalogs])

  return {
    countries,
    loading,
    error,
    refetch: () => fetchCatalogs().catch(() => undefined),
  }
}
