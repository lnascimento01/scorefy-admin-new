'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CompetitionCountry, CompetitionTypeOption } from '../types'
import { CompetitionsGateway } from '../services/competitions.service'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'

interface UseCompetitionCatalogsState {
  competitionTypes: CompetitionTypeOption[]
  countries: CompetitionCountry[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCompetitionCatalogs(): UseCompetitionCatalogsState {
  const [competitionTypes, setCompetitionTypes] = useState<CompetitionTypeOption[]>([])
  const [countries, setCountries] = useState<CompetitionCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCatalogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [types, countryList] = await Promise.all([
        CompetitionsGateway.listCompetitionTypes(),
        CompetitionsGateway.listCountries(),
      ])
      setCompetitionTypes(types)
      setCountries(countryList)
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar tipos e países.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalogs().catch(() => undefined)
  }, [loadCatalogs])

  return {
    competitionTypes,
    countries,
    loading,
    error,
    refetch: () => loadCatalogs().catch(() => undefined),
  }
}
