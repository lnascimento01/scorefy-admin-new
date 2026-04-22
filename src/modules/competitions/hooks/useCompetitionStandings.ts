'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { CompetitionsGateway } from '../services/competitions.service'
import type {
  Competition,
  CompetitionListMeta,
  CompetitionNaipe,
  CompetitionSeason,
  CompetitionSeasonListItem,
  CompetitionStandingGroupSummary,
  CompetitionStandingRow,
  CompetitionStandingStageSummary,
  CompetitionStandingsScope,
} from '../types'

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

function resolveNaipeSelectionMessage(error: unknown): string | null {
  if (typeof error !== 'object' || !error || !('isAxiosError' in error)) {
    return null
  }

  const axiosError = error as AxiosError<ApiErrorResponse>
  if (axiosError.response?.status !== 422) return null

  const fieldMessage = axiosError.response.data?.errors?.naipe?.[0]
  if (fieldMessage) return fieldMessage

  const message = axiosError.response.data?.message
  if (typeof message === 'string' && message.toLowerCase().includes('naipe')) {
    return message
  }

  return null
}

interface UseCompetitionStandingsState {
  competition: Competition | null
  seasons: CompetitionSeasonListItem[]
  selectedSeasonId: string | null
  selectedSeason: CompetitionSeason | null
  selectedNaipe: CompetitionNaipe | null
  scope: CompetitionStandingsScope
  selectedStageId: string | null
  selectedGroupId: string | null
  standings: CompetitionStandingRow[]
  groups: CompetitionStandingGroupSummary[]
  stages: CompetitionStandingStageSummary[]
  meta: CompetitionListMeta
  loading: boolean
  loadingStandings: boolean
  loadingFilters: boolean
  error: string | null
  selectionMessage: string | null
  requiresNaipeSelection: boolean
  availableNaipes: CompetitionNaipe[]
  filteredGroups: CompetitionStandingGroupSummary[]
  canLoadStandings: boolean
  selectSeason: (seasonId: string | null) => void
  selectNaipe: (naipe: CompetitionNaipe | null) => void
  setScope: (scope: CompetitionStandingsScope) => void
  selectStage: (stageId: string | null) => void
  selectGroup: (groupId: string | null) => void
  refetch: () => void
}

const emptyMeta: CompetitionListMeta = {
  currentPage: 1,
  lastPage: 1,
  perPage: 100,
  total: 0,
}

export function useCompetitionStandings(competitionId: string): UseCompetitionStandingsState {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [seasons, setSeasons] = useState<CompetitionSeasonListItem[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<CompetitionSeason | null>(null)
  const [selectedNaipe, setSelectedNaipe] = useState<CompetitionNaipe | null>(null)
  const [scope, setScopeState] = useState<CompetitionStandingsScope>('global')
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [standings, setStandings] = useState<CompetitionStandingRow[]>([])
  const [groups, setGroups] = useState<CompetitionStandingGroupSummary[]>([])
  const [meta, setMeta] = useState<CompetitionListMeta>(emptyMeta)
  const [loading, setLoading] = useState(true)
  const [loadingStandings, setLoadingStandings] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const availableNaipes = useMemo(
    () => selectedSeason?.availableNaipes?.filter(Boolean) ?? [],
    [selectedSeason],
  )

  const requiresNaipeSelection = availableNaipes.length > 1
  const resolvedNaipe = requiresNaipeSelection ? selectedNaipe : (availableNaipes[0] ?? selectedNaipe ?? undefined)

  const stages = useMemo(() => {
    const map = new Map<string, CompetitionStandingStageSummary>()
    groups.forEach((group) => {
      if (!group.stage?.id) return
      map.set(group.stage.id, group.stage)
    })

    return Array.from(map.values()).sort((left, right) => {
      const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER
      const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.name.localeCompare(right.name, 'pt-BR')
    })
  }, [groups])

  const filteredGroups = useMemo(() => {
    const source = selectedStageId
      ? groups.filter((group) => group.stage?.id === selectedStageId)
      : groups

    return [...source].sort((left, right) => {
      const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER
      const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.name.localeCompare(right.name, 'pt-BR')
    })
  }, [groups, selectedStageId])

  const canLoadStandings = Boolean(
    selectedSeasonId
    && (!requiresNaipeSelection || resolvedNaipe)
    && (scope !== 'stage' || selectedStageId)
    && (scope !== 'group' || selectedGroupId),
  )

  const loadContext = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectionMessage(null)

    try {
      const [competitionDetail, seasonItems] = await Promise.all([
        CompetitionsGateway.getById(competitionId),
        CompetitionsGateway.listSeasons(competitionId),
      ])

      setCompetition(competitionDetail)
      setSeasons(seasonItems)

      const latestSeasonId = competitionDetail.latestSeason?.id
      const resolvedSeasonId =
        (latestSeasonId && seasonItems.some((season) => season.id === latestSeasonId) ? latestSeasonId : null)
        ?? seasonItems[0]?.id
        ?? null

      setSelectedSeasonId((current) => (
        current && seasonItems.some((season) => season.id === current)
          ? current
          : resolvedSeasonId
      ))
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar a classificação da competição.'))
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  useEffect(() => {
    loadContext().catch(() => undefined)
  }, [loadContext, reloadToken])

  useEffect(() => {
    if (!selectedSeasonId) {
      setSelectedSeason(null)
      setGroups([])
      setStandings([])
      setMeta(emptyMeta)
      return
    }

    let active = true

    async function loadSeasonDetail() {
      setLoadingFilters(true)
      setError(null)
      setSelectionMessage(null)

      try {
        const detail = await CompetitionsGateway.getSeason(selectedSeasonId)
        if (!active) return

        setSelectedSeason(detail)
        setSelectedNaipe((current) => {
          const naipes = detail.availableNaipes ?? []
          if (naipes.length === 1) return naipes[0]
          if (current && naipes.includes(current)) return current
          return naipes[0] ?? null
        })
      } catch (err) {
        if (!active) return
        setSelectedSeason(null)
        setGroups([])
        setStandings([])
        setMeta(emptyMeta)
        setError(resolveMatchActionError(err, 'Não foi possível carregar a temporada da classificação.'))
      } finally {
        if (active) {
          setLoadingFilters(false)
        }
      }
    }

    loadSeasonDetail().catch(() => undefined)

    return () => {
      active = false
    }
  }, [selectedSeasonId])

  useEffect(() => {
    if (!selectedSeasonId || (requiresNaipeSelection && !resolvedNaipe)) {
      setGroups([])
      return
    }

    let active = true

    async function loadGroups() {
      setLoadingFilters(true)
      setError(null)

      try {
        const items = await CompetitionsGateway.listGroups({
          competitionSeasonId: selectedSeasonId,
          naipe: resolvedNaipe,
        })
        if (!active) return
        setGroups(items)
      } catch (err) {
        if (!active) return
        setGroups([])
        setError(resolveMatchActionError(err, 'Não foi possível carregar fases e grupos da classificação.'))
      } finally {
        if (active) {
          setLoadingFilters(false)
        }
      }
    }

    loadGroups().catch(() => undefined)

    return () => {
      active = false
    }
  }, [requiresNaipeSelection, resolvedNaipe, selectedSeasonId])

  useEffect(() => {
    if (selectedStageId && !stages.some((stage) => stage.id === selectedStageId)) {
      setSelectedStageId(null)
    }
  }, [selectedStageId, stages])

  useEffect(() => {
    if (scope !== 'stage') return
    if (selectedStageId) return
    if (stages.length === 0) return
    setSelectedStageId(stages[0].id)
  }, [scope, selectedStageId, stages])

  useEffect(() => {
    if (selectedGroupId && !filteredGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(null)
    }
  }, [filteredGroups, selectedGroupId])

  useEffect(() => {
    if (scope !== 'group') return
    if (!selectedStageId && stages.length > 0) {
      setSelectedStageId(stages[0].id)
      return
    }
    if (selectedGroupId) return
    if (filteredGroups.length === 0) return
    setSelectedGroupId(filteredGroups[0].id)
  }, [filteredGroups, scope, selectedGroupId, selectedStageId, stages])

  useEffect(() => {
    if (!selectedSeasonId) {
      setStandings([])
      setMeta(emptyMeta)
      return
    }

    if (requiresNaipeSelection && !resolvedNaipe) {
      setStandings([])
      setMeta(emptyMeta)
      setSelectionMessage('Selecione o naipe para carregar a classificação desta temporada.')
      return
    }

    if (scope === 'stage' && !selectedStageId) {
      setStandings([])
      setMeta(emptyMeta)
      setSelectionMessage('Selecione a fase para ver a classificação filtrada.')
      return
    }

    if (scope === 'group' && !selectedGroupId) {
      setStandings([])
      setMeta(emptyMeta)
      setSelectionMessage('Selecione o grupo para ver a classificação filtrada.')
      return
    }

    let active = true

    async function loadStandings() {
      setLoadingStandings(true)
      setError(null)
      setSelectionMessage(null)

      try {
        const result = await CompetitionsGateway.listStandings({
          competitionSeasonId: selectedSeasonId,
          naipe: resolvedNaipe,
          stageId: scope === 'global' ? undefined : (selectedStageId ?? undefined),
          groupId: scope === 'group' ? (selectedGroupId ?? undefined) : undefined,
        })
        if (!active) return
        setStandings(result.items)
        setMeta(result.meta)
      } catch (err) {
        if (!active) return
        const naipeMessage = resolveNaipeSelectionMessage(err)
        setStandings([])
        setMeta(emptyMeta)
        if (naipeMessage) {
          setSelectionMessage(naipeMessage)
          return
        }
        setError(resolveMatchActionError(err, 'Não foi possível carregar a classificação.'))
      } finally {
        if (active) {
          setLoadingStandings(false)
        }
      }
    }

    loadStandings().catch(() => undefined)

    return () => {
      active = false
    }
  }, [
    requiresNaipeSelection,
    resolvedNaipe,
    scope,
    selectedGroupId,
    selectedSeasonId,
    selectedStageId,
  ])

  const selectSeason = useCallback((seasonId: string | null) => {
    setSelectedSeasonId(seasonId)
    setScopeState('global')
    setSelectedStageId(null)
    setSelectedGroupId(null)
    setSelectedNaipe(null)
    setSelectionMessage(null)
  }, [])

  const selectNaipe = useCallback((naipe: CompetitionNaipe | null) => {
    setSelectedNaipe(naipe)
    setSelectedStageId(null)
    setSelectedGroupId(null)
    setScopeState('global')
    setSelectionMessage(null)
  }, [])

  const setScope = useCallback((nextScope: CompetitionStandingsScope) => {
    setScopeState(nextScope)
    setSelectedStageId(null)
    setSelectedGroupId(null)
    setSelectionMessage(null)
  }, [])

  const selectStage = useCallback((stageId: string | null) => {
    setSelectedStageId(stageId)
    setSelectedGroupId(null)
    setSelectionMessage(null)
  }, [])

  const selectGroup = useCallback((groupId: string | null) => {
    const group = groups.find((item) => item.id === groupId)
    if (group?.stage?.id) {
      setSelectedStageId(group.stage.id)
    }
    setSelectedGroupId(groupId)
    setSelectionMessage(null)
  }, [groups])

  return {
    competition,
    seasons,
    selectedSeasonId,
    selectedSeason,
    selectedNaipe,
    scope,
    selectedStageId,
    selectedGroupId,
    standings,
    groups,
    stages,
    meta,
    loading,
    loadingStandings,
    loadingFilters,
    error,
    selectionMessage,
    requiresNaipeSelection,
    availableNaipes,
    filteredGroups,
    canLoadStandings,
    selectSeason,
    selectNaipe,
    setScope,
    selectStage,
    selectGroup,
    refetch: () => setReloadToken((current) => current + 1),
  }
}
