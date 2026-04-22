'use client'

import { useCallback, useEffect, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { TeamsGateway } from '../services/teams.service'
import type { TeamSummary, TeamUpsertPayload } from '../types'

export function useTeamEditor(teamId: string) {
  const [detail, setDetail] = useState<TeamSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await TeamsGateway.getById(teamId)
      setDetail(data)
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível carregar a equipe.'))
    } finally {
      setLoading(false)
    }
  }, [teamId])

  const update = useCallback(
    async (payload: TeamUpsertPayload) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      try {
        const updated = await TeamsGateway.update(teamId, payload)
        setDetail(updated)
        setSuccess('Equipe atualizada com sucesso.')
        return updated
      } catch (error) {
        setError(resolveMatchActionError(error, 'Não foi possível atualizar a equipe.'))
        return null
      } finally {
        setSaving(false)
      }
    },
    [teamId],
  )

  const remove = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await TeamsGateway.remove(teamId)
      setSuccess('Equipe removida com sucesso.')
      return true
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível remover a equipe.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchDetail().catch(() => undefined)
  }, [fetchDetail])

  return {
    detail,
    loading,
    saving,
    error,
    success,
    refetch: () => fetchDetail().catch(() => undefined),
    update,
    remove,
    setError,
    setSuccess,
  }
}
