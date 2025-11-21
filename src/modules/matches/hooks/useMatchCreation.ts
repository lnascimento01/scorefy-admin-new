'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MatchControlDetail } from '@/modules/match-control/types'
import { resolveMatchActionError } from '../utils/errors'
import { MatchCatalogGateway, type CatalogOption } from '../services/match-catalog.service'
import { MatchesGateway } from '../services/matches.service'
import type { MatchCreatePayload } from '../types'

interface UseMatchCreationState {
  competitions: CatalogOption[]
  teams: CatalogOption[]
  venues: CatalogOption[]
  loadingCatalog: boolean
  loadingTeams: boolean
  submitting: boolean
  error: string | null
  created: MatchControlDetail | null
  reloadCatalog: () => void
  loadTeams: (competitionId?: string) => void
  create: (payload: MatchCreatePayload) => Promise<MatchControlDetail | null>
}

export function useMatchCreation(): UseMatchCreationState {
  const [competitions, setCompetitions] = useState<CatalogOption[]>([])
  const [teams, setTeams] = useState<CatalogOption[]>([])
  const [venues, setVenues] = useState<CatalogOption[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<MatchControlDetail | null>(null)

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    setError(null)
    try {
      const [competitionOptions, venueOptions] = await Promise.all([
        MatchCatalogGateway.listCompetitions(),
        MatchCatalogGateway.listVenues()
      ])
      setCompetitions(competitionOptions)
      setVenues(venueOptions)
    } catch (err) {
      console.error('Failed to load catalog options', err)
      setError('Não foi possível carregar competições e arenas.')
    } finally {
      setLoadingCatalog(false)
    }
  }, [])

  const loadTeams = useCallback(async (competitionId?: string) => {
    setLoadingTeams(true)
    setError(null)
    try {
      const teamOptions = await MatchCatalogGateway.listTeams(competitionId)
      setTeams(teamOptions)
    } catch (err) {
      console.error('Failed to load teams', err)
      setError('Não foi possível carregar as equipes.')
    } finally {
      setLoadingTeams(false)
    }
  }, [])

  const create = useCallback(
    async (payload: MatchCreatePayload) => {
      setSubmitting(true)
      setError(null)
      try {
        const detail = await MatchesGateway.create(payload)
        setCreated(detail)
        return detail
      } catch (err) {
        const message = resolveMatchActionError(err, 'Não foi possível criar a partida.')
        setError(message)
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadCatalog().catch(() => undefined)
    loadTeams().catch(() => undefined)
  }, [loadCatalog, loadTeams])

  return {
    competitions,
    teams,
    venues,
    loadingCatalog,
    loadingTeams,
    submitting,
    error,
    created,
    reloadCatalog: () => loadCatalog().catch(() => undefined),
    loadTeams: (competitionId?: string) => loadTeams(competitionId).catch(() => undefined),
    create
  }
}
