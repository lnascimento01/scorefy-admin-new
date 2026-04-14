'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MatchControlDetail } from '@/modules/match-control/types'
import { MatchCatalogGateway } from '../services/match-catalog.service'
import { MatchesGateway } from '../services/matches.service'
import { resolveMatchActionError } from '../utils/errors'
import type { CatalogOption } from '../services/match-catalog.service'

interface UseMatchEditorState {
  detail: MatchControlDetail | null
  competitions: CatalogOption[]
  seasons: CatalogOption[]
  teams: CatalogOption[]
  venues: CatalogOption[]
  loading: boolean
  submitting: boolean
  error: string | null
  success: string | null
  refetch: () => void
  loadSeasons: (competitionId?: string) => void
  loadTeams: (competitionSeasonId?: string) => void
  update: (payload: {
    competitionSeasonId?: string
    homeTeamId?: string
    awayTeamId?: string
    startAt?: string
    venueId?: string | null
  }) => Promise<MatchControlDetail | null>
}

export function useMatchEditor(matchId: string): UseMatchEditorState {
  const [detail, setDetail] = useState<MatchControlDetail | null>(null)
  const [competitions, setCompetitions] = useState<CatalogOption[]>([])
  const [seasons, setSeasons] = useState<CatalogOption[]>([])
  const [teams, setTeams] = useState<CatalogOption[]>([])
  const [venues, setVenues] = useState<CatalogOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadCatalog = useCallback(async () => {
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
    }
  }, [])

  const loadTeams = useCallback(async (competitionSeasonId?: string) => {
    if (!competitionSeasonId) {
      setTeams([])
      return
    }
    setError(null)
    try {
      const teamOptions = await MatchCatalogGateway.listTeams(competitionSeasonId)
      setTeams(teamOptions)
    } catch (err) {
      console.error('Failed to load teams', err)
      setError('Não foi possível carregar equipes.')
    }
  }, [])

  const loadSeasons = useCallback(async (competitionId?: string) => {
    if (!competitionId) {
      setSeasons([])
      return
    }
    setError(null)
    try {
      const seasonOptions = await MatchCatalogGateway.listCompetitionSeasons(competitionId)
      setSeasons(seasonOptions)
    } catch (err) {
      console.error('Failed to load seasons', err)
      setError('Não foi possível carregar temporadas.')
    }
  }, [])

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await MatchesGateway.getById(matchId)
      setDetail(data)
      await Promise.all([
        loadSeasons(data.competitionId).catch(() => undefined),
        loadTeams(data.competitionSeasonId ?? data.competitionId).catch(() => undefined),
      ])
    } catch (err) {
      console.error('Failed to load match', err)
      setError('Não foi possível carregar dados da partida.')
    } finally {
      setLoading(false)
    }
  }, [loadSeasons, loadTeams, matchId])

  const update = useCallback(
    async (payload: Parameters<UseMatchEditorState['update']>[0]) => {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      try {
        const updated = await MatchesGateway.update(matchId, payload)
        setDetail(updated)
        setSuccess('Dados da partida atualizados com sucesso.')
        return updated
      } catch (err) {
        const message = resolveMatchActionError(err, 'Não foi possível atualizar os dados da partida.')
        setError(message)
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [matchId],
  )

  useEffect(() => {
    Promise.all([loadCatalog(), loadTeams(), loadDetail()]).catch(() => undefined)
  }, [loadCatalog, loadDetail, loadTeams])

  const sortedTeams = useMemo(() => teams, [teams])

  return {
    detail,
    competitions,
    seasons,
    teams: sortedTeams,
    venues,
    loading,
    submitting,
    error,
    success,
    refetch: () => loadDetail().catch(() => undefined),
    loadSeasons: (competitionId?: string) => loadSeasons(competitionId).catch(() => undefined),
    loadTeams: (competitionSeasonId?: string) => loadTeams(competitionSeasonId).catch(() => undefined),
    update
  }
}
