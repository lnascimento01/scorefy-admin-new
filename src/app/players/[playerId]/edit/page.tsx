'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { FullScreenMessage } from '@/modules/dashboard/components/FullScreenMessage'
import { PlayerEditPage } from '@/modules/players/pages/PlayerEditPage'

export default function PlayerEditRoute() {
  const params = useParams<{ playerId: string }>()
  const playerIdParam = params?.playerId
  const playerId = Array.isArray(playerIdParam) ? playerIdParam[0] : playerIdParam ?? ''
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') ?? `/players/${playerId}/edit`
  const { dictionary } = useI18n()

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(fromParam)
      router.replace(`/login?from=${redirect}`)
    }
  }, [fromParam, loading, router, user])

  if (loading || !user || !playerId) {
    return <FullScreenMessage title={dictionary.auth.verifying} />
  }

  return <PlayerEditPage currentUser={user} playerId={playerId} />
}
