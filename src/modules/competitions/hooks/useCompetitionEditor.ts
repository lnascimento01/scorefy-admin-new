'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CompetitionSummary } from '../types'
import { CompetitionsGateway } from '../services/competitions.service'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'

export function useCompetitionEditor(competitionId: string) {
  const [detail, setDetail] = useState<CompetitionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await CompetitionsGateway.getById(competitionId)
      setDetail(data)
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível carregar a competição.'))
    } finally {
      setLoading(false)
    }
  }, [competitionId])

  const update = useCallback(
    async (payload: Partial<CompetitionSummary>) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      try {
        const updated = await CompetitionsGateway.update(competitionId, payload)
        setDetail(updated)
        setSuccess('Competição atualizada com sucesso.')
        return updated
      } catch (err) {
        setError(resolveMatchActionError(err, 'Não foi possível atualizar a competição.'))
        return null
      } finally {
        setSaving(false)
      }
    },
    [competitionId],
  )

  const remove = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      await CompetitionsGateway.remove(competitionId)
      setSuccess('Competição removida.')
    } catch (err) {
      setError(resolveMatchActionError(err, 'Não foi possível remover a competição.'))
    } finally {
      setSaving(false)
    }
  }, [competitionId])

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
    remove
  }
}
