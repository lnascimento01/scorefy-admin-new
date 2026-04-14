'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MatchControlDetail } from '@/modules/match-control/types'
import { resolveMatchActionError } from '../utils/errors'
import { MatchCatalogGateway, type CatalogOption } from '../services/match-catalog.service'
import { MatchesGateway } from '../services/matches.service'
import type { MatchCreatePayload } from '../types'

interface UseMatchCreationState {
  competitions: CatalogOption[]
  seasons: CatalogOption[]
  teams: CatalogOption[]
  venues: CatalogOption[]
  loadingCatalog: boolean
  loadingSeasons: boolean
  loadingTeams: boolean
  submitting: boolean
  error: string | null
  created: MatchControlDetail | null
  reloadCatalog: () => void
  loadSeasons: (competitionId?: string) => void
  loadTeams: (competitionSeasonId?: string) => void
  create: (payload: MatchCreatePayload) => Promise<MatchControlDetail | null>
}

export function useMatchCreation(): UseMatchCreationState {
  const [competitions, setCompetitions] = useState<CatalogOption[]>([])
  const [seasons, setSeasons] = useState<CatalogOption[]>([])
  const [teams, setTeams] = useState<CatalogOption[]>([])
  const [venues, setVenues] = useState<CatalogOption[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingSeasons, setLoadingSeasons] = useState(false)
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

  const loadTeams = useCallback(async (competitionSeasonId?: string) => {
    if (!competitionSeasonId) {
      setTeams([])
      setLoadingTeams(false)
      return
    }
    setLoadingTeams(true)
    setError(null)
    try {
      const teamOptions = await MatchCatalogGateway.listTeams(competitionSeasonId)
      setTeams(teamOptions)
    } catch (err) {
      console.error('Failed to load teams', err)
      setError('Não foi possível carregar as equipes.')
    } finally {
      setLoadingTeams(false)
    }
  }, [])

  const loadSeasons = useCallback(async (competitionId?: string) => {
    if (!competitionId) {
      setSeasons([])
      return
    }
    setLoadingSeasons(true)
    setError(null)
    try {
      const seasonOptions = await MatchCatalogGateway.listCompetitionSeasons(competitionId)
      setSeasons(seasonOptions)
    } catch (err) {
      console.error('Failed to load seasons', err)
      setError('Não foi possível carregar as temporadas.')
    } finally {
      setLoadingSeasons(false)
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
  }, [loadCatalog, loadTeams])

  return {
    competitions,
    seasons,
    teams,
    venues,
    loadingCatalog,
    loadingSeasons,
    loadingTeams,
    submitting,
    error,
    created,
    reloadCatalog: () => loadCatalog().catch(() => undefined),
    loadSeasons: (competitionId?: string) => loadSeasons(competitionId).catch(() => undefined),
    loadTeams: (competitionSeasonId?: string) => loadTeams(competitionSeasonId).catch(() => undefined),
    create
  }
}
