'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FullScreenMessage } from '@/modules/dashboard/components/FullScreenMessage'
import { CompetitionStandingsPage } from '@/modules/competitions/pages/CompetitionStandingsPage'
import { useI18n } from '@/lib/i18n'

export default function CompetitionStandingsRoute() {
  const params = useParams<{ competitionId: string }>()
  const competitionIdParam = params?.competitionId
  const competitionId = Array.isArray(competitionIdParam) ? competitionIdParam[0] : competitionIdParam ?? ''
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') ?? `/competitions/${competitionId}/standings`
  const { dictionary } = useI18n()

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(fromParam)
      router.replace(`/login?from=${redirect}`)
    }
  }, [fromParam, loading, router, user])

  if (loading || !user || !competitionId) {
    return <FullScreenMessage title={dictionary.auth.verifying} />
  }

  return <CompetitionStandingsPage currentUser={user} competitionId={competitionId} />
}
