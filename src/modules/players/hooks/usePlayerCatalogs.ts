'use client'

import { useCallback, useEffect, useState } from 'react'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import { PlayersGateway } from '../services/players.service'
import type { PlayerCatalogOption } from '../types'

export function usePlayerCatalogs() {
  const [teams, setTeams] = useState<PlayerCatalogOption[]>([])
  const [positions, setPositions] = useState<PlayerCatalogOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamOptions, positionOptions] = await Promise.all([
        PlayersGateway.listTeams(),
        PlayersGateway.listPositions(),
      ])

      setTeams(teamOptions)
      setPositions(positionOptions)
    } catch (error) {
      setError(resolveMatchActionError(error, 'Não foi possível carregar os catálogos de atletas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  return {
    teams,
    positions,
    loading,
    error,
    refetch: () => load().catch(() => undefined),
  }
}
