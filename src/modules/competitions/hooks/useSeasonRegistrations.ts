'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import type {
  CompetitionSeasonRegistrationPlayerSummary,
  CompetitionSeasonRegistrationTeamSummary,
  CompetitionSeasonTeamPlayerRegistrationUpdatePayload,
  CompetitionSeasonTeamRegistration,
  CompetitionSeasonTeamRegistrationCreatePayload,
  CompetitionSeasonTeamRegistrationUpdatePayload,
} from '../types'
import { SeasonRegistrationsGateway } from '../services/season-registrations.service'

interface UseSeasonRegistrationsState {
  registrations: CompetitionSeasonTeamRegistration[]
  selectedRegistrationId: string | null
  selectedRegistration: CompetitionSeasonTeamRegistration | null
  teamOptions: CompetitionSeasonRegistrationTeamSummary[]
  playerOptions: CompetitionSeasonRegistrationPlayerSummary[]
  loading: boolean
  saving: boolean
  searchingTeams: boolean
  searchingPlayers: boolean
  error: string | null
  success: string | null
  selectRegistration: (registrationId: string | null) => void
  refetch: () => void
  searchTeams: (query: string) => Promise<void>
  searchPlayers: (teamId: string, query: string) => Promise<void>
  createTeamRegistration: (payload: CompetitionSeasonTeamRegistrationCreatePayload) => Promise<CompetitionSeasonTeamRegistration | null>
  updateTeamRegistration: (registrationId: string, payload: CompetitionSeasonTeamRegistrationUpdatePayload) => Promise<CompetitionSeasonTeamRegistration | null>
  deleteTeamRegistration: (registrationId: string) => Promise<boolean>
  addPlayerRegistration: (registrationId: string, payload: Parameters<typeof SeasonRegistrationsGateway.addPlayerRegistration>[1]) => Promise<boolean>
  addPlayerRegistrationsBatch: (
    registrationId: string,
    payloads: Parameters<typeof SeasonRegistrationsGateway.addPlayerRegistration>[1][],
  ) => Promise<{ added: number; failed: number }>
  reconcilePlayerRegistrations: (
    registrationId: string,
    payload: {
      add: Parameters<typeof SeasonRegistrationsGateway.addPlayerRegistration>[1][]
      remove: string[]
    },
  ) => Promise<{ added: number; removed: number; failed: number }>
  updatePlayerRegistration: (playerRegistrationId: string, payload: CompetitionSeasonTeamPlayerRegistrationUpdatePayload) => Promise<boolean>
  deletePlayerRegistration: (playerRegistrationId: string) => Promise<boolean>
}

export function useSeasonRegistrations(seasonId: string | null): UseSeasonRegistrationsState {
  const [registrations, setRegistrations] = useState<CompetitionSeasonTeamRegistration[]>([])
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<CompetitionSeasonTeamRegistration | null>(null)
  const [teamOptions, setTeamOptions] = useState<CompetitionSeasonRegistrationTeamSummary[]>([])
  const [playerOptions, setPlayerOptions] = useState<CompetitionSeasonRegistrationPlayerSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchingTeams, setSearchingTeams] = useState(false)
  const [searchingPlayers, setSearchingPlayers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchRegistrations = useCallback(async () => {
    if (!seasonId) {
      setRegistrations([])
      setSelectedRegistrationId(null)
      setSelectedRegistration(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const items = await SeasonRegistrationsGateway.listTeamRegistrations(seasonId)
      setRegistrations(items)

      setSelectedRegistrationId((current) => {
        if (current && items.some((item) => item.id === current)) return current
        return items[0]?.id ?? null
      })
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar as inscrições da temporada.'))
      setRegistrations([])
      setSelectedRegistration(null)
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  const fetchRegistrationDetail = useCallback(async (registrationId: string | null) => {
    if (!registrationId) {
      setSelectedRegistration(null)
      setPlayerOptions([])
      return
    }

    setError(null)
    try {
      const detail = await SeasonRegistrationsGateway.getTeamRegistration(registrationId)
      setSelectedRegistration(detail)
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar o detalhe da inscrição do time.'))
      setSelectedRegistration(null)
    }
  }, [])

  useEffect(() => {
    fetchRegistrations().catch(() => undefined)
  }, [fetchRegistrations])

  useEffect(() => {
    fetchRegistrationDetail(selectedRegistrationId).catch(() => undefined)
  }, [fetchRegistrationDetail, selectedRegistrationId])

  useEffect(() => {
    setPlayerOptions([])
  }, [selectedRegistrationId])

  const syncAfterMutation = useCallback(async (registrationId?: string | null) => {
    if (!seasonId) return
    const items = await SeasonRegistrationsGateway.listTeamRegistrations(seasonId)
    setRegistrations(items)

    const nextId = registrationId && items.some((item) => item.id === registrationId)
      ? registrationId
      : items[0]?.id ?? null

    setSelectedRegistrationId(nextId)

    if (nextId) {
      const detail = await SeasonRegistrationsGateway.getTeamRegistration(nextId)
      setSelectedRegistration(detail)
    } else {
      setSelectedRegistration(null)
    }
  }, [seasonId])

  const createTeamRegistration = useCallback(async (payload: CompetitionSeasonTeamRegistrationCreatePayload) => {
    if (!seasonId) return null

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const created = await SeasonRegistrationsGateway.createTeamRegistration(seasonId, payload)
      await syncAfterMutation(created.id)
      setSuccess('Time inscrito com sucesso.')
      return created
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível inscrever o time na temporada.'))
      return null
    } finally {
      setSaving(false)
    }
  }, [seasonId, syncAfterMutation])

  const updateTeamRegistration = useCallback(async (registrationId: string, payload: CompetitionSeasonTeamRegistrationUpdatePayload) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await SeasonRegistrationsGateway.updateTeamRegistration(registrationId, payload)
      await syncAfterMutation(updated.id)
      setSuccess('Inscrição do time atualizada.')
      return updated
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar a inscrição do time.'))
      return null
    } finally {
      setSaving(false)
    }
  }, [syncAfterMutation])

  const deleteTeamRegistration = useCallback(async (registrationId: string) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await SeasonRegistrationsGateway.deleteTeamRegistration(registrationId)
      await syncAfterMutation(selectedRegistrationId === registrationId ? null : selectedRegistrationId)
      setSuccess('Inscrição do time retirada da temporada.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível retirar o time da temporada.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [selectedRegistrationId, syncAfterMutation])

  const addPlayerRegistration = useCallback(async (
    registrationId: string,
    payload: Parameters<typeof SeasonRegistrationsGateway.addPlayerRegistration>[1],
  ) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await SeasonRegistrationsGateway.addPlayerRegistration(registrationId, payload)
      await syncAfterMutation(registrationId)
      setSuccess('Atleta inscrito com sucesso.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível inscrever o atleta.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [syncAfterMutation])

  const addPlayerRegistrationsBatch = useCallback(async (
    registrationId: string,
    payloads: Parameters<typeof SeasonRegistrationsGateway.addPlayerRegistration>[1][],
  ) => {
    if (payloads.length === 0) {
      return { added: 0, failed: 0 }
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const results = await Promise.allSettled(
        payloads.map((payload) => SeasonRegistrationsGateway.addPlayerRegistration(registrationId, payload)),
      )

      const added = results.filter((result) => result.status === 'fulfilled').length
      const failed = results.length - added

      await syncAfterMutation(registrationId)

      if (added > 0 && failed === 0) {
        setSuccess(
          added === 1
            ? '1 atleta inscrito com sucesso.'
            : `${added} atletas inscritos com sucesso.`,
        )
      } else if (added > 0) {
        setSuccess(`${added} atletas inscritos. ${failed} falharam e precisam de revisão.`)
      } else {
        setError('Não foi possível inscrever os atletas selecionados.')
      }

      return { added, failed }
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível concluir a inscrição em lote de atletas.'))
      return { added: 0, failed: payloads.length }
    } finally {
      setSaving(false)
    }
  }, [syncAfterMutation])

  const reconcilePlayerRegistrations = useCallback(async (
    registrationId: string,
    payload: {
      add: Parameters<typeof SeasonRegistrationsGateway.addPlayerRegistration>[1][]
      remove: string[]
    },
  ) => {
    const operations = [
      ...payload.add.map((item) => ({ kind: 'add' as const, promise: SeasonRegistrationsGateway.addPlayerRegistration(registrationId, item) })),
      ...payload.remove.map((playerRegistrationId) => ({ kind: 'remove' as const, promise: SeasonRegistrationsGateway.deletePlayerRegistration(playerRegistrationId) })),
    ]

    if (operations.length === 0) {
      return { added: 0, removed: 0, failed: 0 }
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const results = await Promise.allSettled(operations.map((operation) => operation.promise))

      let added = 0
      let removed = 0
      let failed = 0

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (operations[index].kind === 'add') added += 1
          if (operations[index].kind === 'remove') removed += 1
          return
        }

        failed += 1
      })

      await syncAfterMutation(registrationId)

      if (failed === 0) {
        const summary = [
          added > 0 ? `${added} ${added === 1 ? 'atleta inscrito' : 'atletas inscritos'}` : null,
          removed > 0 ? `${removed} ${removed === 1 ? 'atleta retirado' : 'atletas retirados'}` : null,
        ].filter(Boolean).join(' e ')

        setSuccess(summary ? `${summary} com sucesso.` : 'Elenco atualizado com sucesso.')
      } else if (added > 0 || removed > 0) {
        setSuccess(`${added} adicionados, ${removed} removidos. ${failed} operação(ões) falharam e precisam de revisão.`)
      } else {
        setError('Não foi possível atualizar o elenco selecionado.')
      }

      return { added, removed, failed }
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível reconciliar o elenco inscrito.'))
      return { added: 0, removed: 0, failed: operations.length }
    } finally {
      setSaving(false)
    }
  }, [syncAfterMutation])

  const updatePlayerRegistration = useCallback(async (playerRegistrationId: string, payload: CompetitionSeasonTeamPlayerRegistrationUpdatePayload) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await SeasonRegistrationsGateway.updatePlayerRegistration(playerRegistrationId, payload)
      await syncAfterMutation(updated.competitionSeasonTeamRegistrationId)
      setSuccess('Inscrição do atleta atualizada.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível atualizar a inscrição do atleta.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [syncAfterMutation])

  const deletePlayerRegistration = useCallback(async (playerRegistrationId: string) => {
    const currentRegistrationId = selectedRegistration?.id
    if (!currentRegistrationId) return false

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await SeasonRegistrationsGateway.deletePlayerRegistration(playerRegistrationId)
      await syncAfterMutation(currentRegistrationId)
      setSuccess('Atleta retirado da inscrição do time.')
      return true
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível retirar o atleta da inscrição.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [selectedRegistration, syncAfterMutation])

  const searchTeams = useCallback(async (query: string) => {
    setSearchingTeams(true)
    try {
      const items = await SeasonRegistrationsGateway.searchTeams(query)
      setTeamOptions(items)
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível buscar times.'))
      setTeamOptions([])
    } finally {
      setSearchingTeams(false)
    }
  }, [])

  const searchPlayers = useCallback(async (teamId: string, query: string) => {
    setSearchingPlayers(true)
    try {
      const items = await SeasonRegistrationsGateway.searchPlayers(teamId, query)
      setPlayerOptions(items)
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível buscar atletas do time.'))
      setPlayerOptions([])
    } finally {
      setSearchingPlayers(false)
    }
  }, [])

  const resolvedSelectedRegistration = useMemo(
    () => selectedRegistration ?? registrations.find((item) => item.id === selectedRegistrationId) ?? null,
    [registrations, selectedRegistration, selectedRegistrationId],
  )

  return {
    registrations,
    selectedRegistrationId,
    selectedRegistration: resolvedSelectedRegistration,
    teamOptions,
    playerOptions,
    loading,
    saving,
    searchingTeams,
    searchingPlayers,
    error,
    success,
    selectRegistration: setSelectedRegistrationId,
    refetch: () => fetchRegistrations().catch(() => undefined),
    searchTeams,
    searchPlayers,
    createTeamRegistration,
    updateTeamRegistration,
    deleteTeamRegistration,
    addPlayerRegistration,
    addPlayerRegistrationsBatch,
    reconcilePlayerRegistrations,
    updatePlayerRegistration,
    deletePlayerRegistration,
  }
}
