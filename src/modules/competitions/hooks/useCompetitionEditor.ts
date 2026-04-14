'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Competition,
  CompetitionConfigSnapshot,
  CompetitionHandballRulesPayload,
  CompetitionSeason,
  CompetitionSeasonCreatePayload,
  CompetitionSeasonListItem,
  CompetitionSeasonUpdatePayload,
  CompetitionUpdatePayload,
  JsonValue,
} from '../types'
import { CompetitionsGateway } from '../services/competitions.service'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'

interface UseCompetitionEditorState {
  competition: Competition | null
  seasons: CompetitionSeasonListItem[]
  selectedSeason: CompetitionSeason | null
  selectedSeasonId: string | null
  loading: boolean
  savingCompetition: boolean
  savingSeason: boolean
  savingConfig: boolean
  savingRules: boolean
  removingCompetition: boolean
  removingSeason: boolean
  error: string | null
  success: string | null
  refetch: () => void
  selectSeason: (seasonId: string | null) => void
  updateCompetition: (payload: CompetitionUpdatePayload) => Promise<Competition | null>
  createSeason: (payload: CompetitionSeasonCreatePayload) => Promise<CompetitionSeason | null>
  updateSeason: (seasonId: string, payload: CompetitionSeasonUpdatePayload) => Promise<CompetitionSeason | null>
  removeSeason: (seasonId: string) => Promise<boolean>
  updateSeasonConfig: (seasonId: string, overrides: JsonValue) => Promise<CompetitionConfigSnapshot | null>
  updateSeasonHandballRules: (seasonId: string, payload: CompetitionHandballRulesPayload) => Promise<boolean>
  removeCompetition: () => Promise<boolean>
}

export function useCompetitionEditor(competitionId: string): UseCompetitionEditorState {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [seasons, setSeasons] = useState<CompetitionSeasonListItem[]>([])
  const [selectedSeason, setSelectedSeason] = useState<CompetitionSeason | null>(null)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingCompetition, setSavingCompetition] = useState(false)
  const [savingSeason, setSavingSeason] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingRules, setSavingRules] = useState(false)
  const [removingCompetition, setRemovingCompetition] = useState(false)
  const [removingSeason, setRemovingSeason] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const seasonCount = seasons.length

  const loadCompetition = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await CompetitionsGateway.getById(competitionId)
      setCompetition(data)
      const seasonList = await CompetitionsGateway.listSeasons(competitionId)
      setSeasons(seasonList)
      if (seasonList.length === 1) {
        setSelectedSeasonId(seasonList[0].id)
      }
      if (seasonList.length === 0) {
        setSelectedSeasonId(null)
        setSelectedSeason(null)
      }
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar a competição.'))
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  const fetchSeasonDetail = useCallback(async (seasonId: string | null) => {
    if (!seasonId) {
      setSelectedSeason(null)
      return
    }
    setError(null)
    try {
      const detail = await CompetitionsGateway.getSeason(seasonId)
      setSelectedSeason(detail)
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar a temporada selecionada.'))
      setSelectedSeason(null)
    }
  }, [])

  useEffect(() => {
    loadCompetition().catch(() => undefined)
  }, [loadCompetition])

  useEffect(() => {
    fetchSeasonDetail(selectedSeasonId).catch(() => undefined)
  }, [fetchSeasonDetail, selectedSeasonId])

  const updateCompetition = useCallback(async (payload: CompetitionUpdatePayload) => {
    setSavingCompetition(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await CompetitionsGateway.update(competitionId, payload)
      setCompetition(updated)
      setSuccess('Competição atualizada com sucesso.')
      return updated
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar a competição.'))
      return null
    } finally {
      setSavingCompetition(false)
    }
  }, [competitionId])

  const createSeason = useCallback(async (payload: CompetitionSeasonCreatePayload) => {
    setSavingSeason(true)
    setError(null)
    setSuccess(null)
    try {
      const season = await CompetitionsGateway.createSeason(competitionId, payload)
      const next = await CompetitionsGateway.listSeasons(competitionId)
      setSeasons(next)
      setSelectedSeasonId(season.id)
      setSuccess('Temporada criada com sucesso.')
      return season
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível criar a temporada.'))
      return null
    } finally {
      setSavingSeason(false)
    }
  }, [competitionId])

  const updateSeason = useCallback(async (seasonId: string, payload: CompetitionSeasonUpdatePayload) => {
    setSavingSeason(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await CompetitionsGateway.updateSeason(seasonId, payload)
      const next = await CompetitionsGateway.listSeasons(competitionId)
      setSeasons(next)
      setSelectedSeason(updated)
      setSelectedSeasonId(updated.id)
      setSuccess('Temporada atualizada com sucesso.')
      return updated
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar a temporada.'))
      return null
    } finally {
      setSavingSeason(false)
    }
  }, [competitionId])

  const removeSeason = useCallback(async (seasonId: string) => {
    setRemovingSeason(true)
    setError(null)
    setSuccess(null)
    try {
      await CompetitionsGateway.deleteSeason(seasonId)
      const next = await CompetitionsGateway.listSeasons(competitionId)
      setSeasons(next)
      if (selectedSeasonId === seasonId) {
        const nextId = next.length === 1 ? next[0].id : null
        setSelectedSeasonId(nextId)
        if (!nextId) setSelectedSeason(null)
      }
      setSuccess('Temporada removida.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível remover a temporada.'))
      return false
    } finally {
      setRemovingSeason(false)
    }
  }, [competitionId, selectedSeasonId])

  const updateSeasonConfig = useCallback(async (seasonId: string, overrides: JsonValue) => {
    setSavingConfig(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await CompetitionsGateway.updateSeasonConfig(seasonId, overrides)
      setSelectedSeason((prev) =>
        prev
          ? {
              ...prev,
              configOverrides: updated.overrides,
              effectiveConfig: updated.effective,
              updatedAt: updated.updatedAt ?? prev.updatedAt,
            }
          : prev,
      )
      setSuccess('Configuração da temporada atualizada com sucesso.')
      return updated
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar a configuração da temporada.'))
      return null
    } finally {
      setSavingConfig(false)
    }
  }, [])

  const updateSeasonHandballRules = useCallback(async (seasonId: string, payload: CompetitionHandballRulesPayload) => {
    setSavingRules(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await CompetitionsGateway.updateSeasonHandballRules(seasonId, payload)
      setSelectedSeason((prev) =>
        prev
          ? {
              ...prev,
              handballRule: updated.rules,
              updatedAt: updated.updatedAt ?? prev.updatedAt,
            }
          : prev,
      )
      setSuccess('Regras da temporada atualizadas com sucesso.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar as regras da temporada.'))
      return false
    } finally {
      setSavingRules(false)
    }
  }, [])

  const removeCompetition = useCallback(async () => {
    setRemovingCompetition(true)
    setError(null)
    setSuccess(null)
    try {
      await CompetitionsGateway.remove(competitionId)
      setSuccess('Competição removida.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível remover a competição.'))
      return false
    } finally {
      setRemovingCompetition(false)
    }
  }, [competitionId])

  const canAutoSelectSeason = useMemo(
    () => seasonCount === 1 && selectedSeasonId === null && seasons[0],
    [seasonCount, selectedSeasonId, seasons],
  )

  useEffect(() => {
    if (canAutoSelectSeason && seasons[0]) {
      setSelectedSeasonId(seasons[0].id)
    }
  }, [canAutoSelectSeason, seasons])

  return {
    competition,
    seasons,
    selectedSeason,
    selectedSeasonId,
    loading,
    savingCompetition,
    savingSeason,
    savingConfig,
    savingRules,
    removingCompetition,
    removingSeason,
    error,
    success,
    refetch: () => loadCompetition().catch(() => undefined),
    selectSeason: (seasonId: string | null) => setSelectedSeasonId(seasonId),
    updateCompetition,
    createSeason,
    updateSeason,
    removeSeason,
    updateSeasonConfig,
    updateSeasonHandballRules,
    removeCompetition,
  }
}
