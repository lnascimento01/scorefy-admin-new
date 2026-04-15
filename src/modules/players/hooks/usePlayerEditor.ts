'use client'

import { useCallback, useEffect, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { PlayersGateway } from '../services/players.service'
import type { PlayerSummary, PlayerTransferPayload, PlayerUpsertPayload } from '../types'

export function usePlayerEditor(playerId: string) {
  const [detail, setDetail] = useState<PlayerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PlayersGateway.getById(playerId)
      setDetail(data)
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível carregar o atleta.'))
    } finally {
      setLoading(false)
    }
  }, [playerId])

  useEffect(() => {
    fetchDetail().catch(() => undefined)
  }, [fetchDetail])

  const update = useCallback(
    async (payload: PlayerUpsertPayload) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      try {
        const updated = await PlayersGateway.update(playerId, payload)
        setDetail(updated)
        setSuccess('Atleta atualizado com sucesso.')
        return updated
      } catch (error) {
        setError(resolveMatchActionError(error, 'Não foi possível atualizar o atleta.'))
        return null
      } finally {
        setSaving(false)
      }
    },
    [playerId],
  )

  const transfer = useCallback(
    async (payload: PlayerTransferPayload) => {
      setSaving(true)
      setError(null)
      setSuccess(null)
      try {
        const updated = await PlayersGateway.transfer(playerId, payload)
        setDetail(updated)
        setSuccess('Transferência concluída com sucesso.')
        return updated
      } catch (error) {
        setError(resolveMatchActionError(error, 'Não foi possível transferir o atleta.'))
        return null
      } finally {
        setSaving(false)
      }
    },
    [playerId],
  )

  const remove = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await PlayersGateway.remove(playerId)
      setSuccess('Atleta removido com sucesso.')
      return true
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível remover o atleta.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [playerId])

  return {
    detail,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    update,
    transfer,
    remove,
    refetch: () => fetchDetail().catch(() => undefined),
  }
}
