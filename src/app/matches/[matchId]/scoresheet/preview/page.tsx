'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FullScreenMessage } from '@/modules/dashboard/components/FullScreenMessage'
import { useI18n } from '@/lib/i18n'
import { ScoresheetPreviewPage } from '@/modules/matches/pages/ScoresheetPreviewPage'

export default function ScoresheetPreviewRoute() {
  const params = useParams<{ matchId: string }>()
  const matchIdParam = params?.matchId
  const matchId = Array.isArray(matchIdParam) ? matchIdParam[0] : matchIdParam ?? ''
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') ?? `/matches/${matchId}/scoresheet/preview`
  const { dictionary } = useI18n()

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(fromParam)
      router.replace(`/login?from=${redirect}`)
    }
  }, [fromParam, loading, router, user])

  if (loading || !user || !matchId) {
    return <FullScreenMessage title={dictionary.auth.verifying} />
  }

  return <ScoresheetPreviewPage currentUser={user} matchId={matchId} />
}
