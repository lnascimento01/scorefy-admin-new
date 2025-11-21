'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MatchControlDetail, MatchControlParticipant } from '@/modules/match-control/types'
import { MatchesGateway } from '../services/matches.service'
import { resolveMatchActionError } from '../utils/errors'

function toId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  return null
}

interface UseMatchRosterEditorState {
  detail: MatchControlDetail | null
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
  removedIds: Set<string>
  addIds: string[]
  addInput: string
  toggleRemoval: (id: string) => void
  removeFromAdds: (id: string) => void
  addCandidate: (id: string) => void
  setAddInput: (value: string) => void
  refresh: () => void
  submitChanges: () => Promise<void>
}

export function useMatchRosterEditor(matchId: string): UseMatchRosterEditorState {
  const [detail, setDetail] = useState<MatchControlDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [addIds, setAddIds] = useState<string[]>([])
  const [addInput, setAddInput] = useState('')

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await MatchesGateway.getById(matchId)
      setDetail(data)
    } catch (err) {
      console.error('Failed to load match detail', err)
      setError('Não foi possível carregar os jogadores desta partida.')
    } finally {
      setLoading(false)
    }
  }, [matchId])

  const toggleRemoval = useCallback((id: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setSuccess(null)
  }, [])

  const removeFromAdds = useCallback((id: string) => {
    setAddIds((prev) => prev.filter((item) => item !== id))
    setSuccess(null)
  }, [])

  const addCandidate = useCallback(
    (rawId: string) => {
      const id = toId(rawId)
      if (!id) return
      const isAlreadyInMatch =
        detail?.participants.home.some((p) => p.id === id) ||
        detail?.participants.away.some((p) => p.id === id)
      if (isAlreadyInMatch) {
        setError('Este jogador já está escalado nesta partida.')
        return
      }
      setAddIds((prev) => {
        if (prev.includes(id)) return prev
        return [...prev, id]
      })
      setAddInput('')
      setSuccess(null)
    },
    [detail],
  )

  const filteredAddIds = useMemo(
    () => addIds.filter((id) => !removedIds.has(id)),
    [addIds, removedIds]
  )

  const submitChanges = useCallback(async () => {
    if (!detail) return
    const removeList = Array.from(removedIds)
    const addList = filteredAddIds

    if (!removeList.length && !addList.length) {
      setError('Selecione ao menos um jogador para remover ou adicionar.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await MatchesGateway.updatePlayers(matchId, {
        addPlayerIds: addList,
        removePlayerIds: removeList
      })
      setDetail(updated)
      setRemovedIds(new Set())
      setAddIds([])
      setSuccess('Elenco atualizado com sucesso.')
    } catch (err) {
      const message = resolveMatchActionError(err, 'Não foi possível atualizar o elenco.')
      setError(message)
    } finally {
      setSaving(false)
    }
  }, [detail, filteredAddIds, matchId, removedIds])

  useEffect(() => {
    fetchDetail().catch(() => undefined)
  }, [fetchDetail])

  return {
    detail,
    loading,
    saving,
    error,
    success,
    removedIds,
    addIds: filteredAddIds,
    addInput,
    toggleRemoval,
    removeFromAdds,
    addCandidate,
    setAddInput,
    refresh: () => fetchDetail().catch(() => undefined),
    submitChanges
  }
}
