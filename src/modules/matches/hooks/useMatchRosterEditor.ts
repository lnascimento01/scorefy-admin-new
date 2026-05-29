'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SeasonRegistrationsGateway } from '@/modules/competitions/services/season-registrations.service'
import type {
  CompetitionSeasonTeamPlayerRegistration,
  CompetitionSeasonTeamRegistration
} from '@/modules/competitions/types'
import type { MatchControlDetail } from '@/modules/match-control/types'
import type { MatchSide } from '@/modules/match-control/types'
import { MatchesGateway } from '../services/matches.service'
import { resolveMatchActionError } from '../utils/errors'

interface UseMatchRosterEditorState {
  detail: MatchControlDetail | null
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
  eligiblePlayers: Record<MatchSide, CompetitionSeasonTeamPlayerRegistration[]>
  search: Record<MatchSide, string>
  addIds: string[]
  removeIds: string[]
  setSearch: (side: MatchSide, value: string) => void
  toggleAdd: (id: string) => void
  toggleRemove: (id: string) => void
  refresh: () => void
  submitChanges: () => Promise<void>
}

const EMPTY_ELIGIBLE: Record<MatchSide, CompetitionSeasonTeamPlayerRegistration[]> = {
  home: [],
  away: []
}

const EMPTY_SEARCH: Record<MatchSide, string> = {
  home: '',
  away: ''
}

function isEligibleRegistration(player: CompetitionSeasonTeamPlayerRegistration): boolean {
  return (
    player.isActive &&
    ['draft', 'submitted', 'under_review', 'approved'].includes(player.registrationStatus) &&
    player.eligibilityStatus === 'eligible' &&
    Boolean(player.player)
  )
}

function sortByShirtAndName(
  left: CompetitionSeasonTeamPlayerRegistration,
  right: CompetitionSeasonTeamPlayerRegistration
): number {
  const leftShirt = left.shirtNumber ?? Number.MAX_SAFE_INTEGER
  const rightShirt = right.shirtNumber ?? Number.MAX_SAFE_INTEGER

  if (leftShirt !== rightShirt) {
    return leftShirt - rightShirt
  }

  const leftName = left.player?.fullName ?? left.player?.nickname ?? ''
  const rightName = right.player?.fullName ?? right.player?.nickname ?? ''
  return leftName.localeCompare(rightName, 'pt-BR')
}

function normalizeSearch(text: string) {
  return text
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function matchesSearch(player: CompetitionSeasonTeamPlayerRegistration, query: string) {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return true

  const values = [
    player.player?.fullName,
    player.player?.nickname,
    player.player?.number !== undefined && player.player?.number !== null ? `#${player.player.number}` : null,
    player.position,
    player.player?.positionName
  ]
    .filter(Boolean)
    .join(' ')

  return normalizeSearch(values).includes(normalizedQuery)
}

function findTeamRegistration(
  registrations: CompetitionSeasonTeamRegistration[],
  teamId: string
): CompetitionSeasonTeamRegistration | null {
  return registrations.find((registration) => registration.teamId === teamId) ?? null
}

async function loadEligiblePlayers(
  competitionSeasonId: string,
  teamId: string
): Promise<CompetitionSeasonTeamPlayerRegistration[]> {
  const registrations = await SeasonRegistrationsGateway.listTeamRegistrations(competitionSeasonId)
  const teamRegistration = findTeamRegistration(registrations, teamId)
  if (!teamRegistration) {
    return []
  }

  if (
    !['draft', 'submitted', 'under_review', 'approved'].includes(teamRegistration.registrationStatus) ||
    teamRegistration.eligibilityStatus !== 'eligible'
  ) {
    return []
  }

  const detail = await SeasonRegistrationsGateway.getTeamRegistration(teamRegistration.id)
  return (detail.players ?? [])
    .filter(isEligibleRegistration)
    .sort(sortByShirtAndName)
}

export function useMatchRosterEditor(matchId: string): UseMatchRosterEditorState {
  const [detail, setDetail] = useState<MatchControlDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [eligiblePlayers, setEligiblePlayers] = useState<Record<MatchSide, CompetitionSeasonTeamPlayerRegistration[]>>(EMPTY_ELIGIBLE)
  const [search, setSearchState] = useState<Record<MatchSide, string>>(EMPTY_SEARCH)
  const [addIds, setAddIds] = useState<string[]>([])
  const [removeIds, setRemoveIds] = useState<string[]>([])

  const loadContext = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const match = await MatchesGateway.getById(matchId)
      setDetail(match)

      if (!match.competitionSeasonId) {
        setEligiblePlayers(EMPTY_ELIGIBLE)
        return
      }

      const [homeEligible, awayEligible] = await Promise.all([
        loadEligiblePlayers(match.competitionSeasonId, match.homeTeam.id),
        loadEligiblePlayers(match.competitionSeasonId, match.awayTeam.id)
      ])

      setEligiblePlayers({
        home: homeEligible,
        away: awayEligible
      })
    } catch (err) {
      console.error('Failed to load match roster context', err)
      setError('Não foi possível carregar o contexto da partida.')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  const toggleAdd = useCallback((id: string) => {
    setAddIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    setSuccess(null)
  }, [])

  const toggleRemove = useCallback((id: string) => {
    setRemoveIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    setSuccess(null)
  }, [])

  const filteredAddIds = useMemo(() => addIds.filter((id) => !removeIds.includes(id)), [addIds, removeIds])
  const filteredRemoveIds = useMemo(() => removeIds.filter((id) => !addIds.includes(id)), [addIds, removeIds])

  const submitChanges = useCallback(async () => {
    if (!detail) return

    if (filteredAddIds.length === 0 && filteredRemoveIds.length === 0) {
      setError('Selecione ao menos um atleta para incluir ou remover.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await MatchesGateway.updatePlayers(matchId, {
        addPlayerIds: filteredAddIds,
        removePlayerIds: filteredRemoveIds
      })

      setDetail(updated)
      setAddIds([])
      setRemoveIds([])
      setSuccess('Elenco da partida atualizado com sucesso.')
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar o elenco da partida.'))
    } finally {
      setSaving(false)
    }
  }, [detail, filteredAddIds, filteredRemoveIds, matchId])

  useEffect(() => {
    loadContext().catch(() => undefined)
  }, [loadContext])

  return {
    detail,
    loading,
    saving,
    error,
    success,
    eligiblePlayers,
    search,
    addIds: filteredAddIds,
    removeIds: filteredRemoveIds,
    setSearch: (side, value) => setSearchState((prev) => ({ ...prev, [side]: value })),
    toggleAdd,
    toggleRemove,
    refresh: () => loadContext().catch(() => undefined),
    submitChanges
  }
}
