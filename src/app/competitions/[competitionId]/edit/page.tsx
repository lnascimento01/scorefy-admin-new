'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { FullScreenMessage } from '@/modules/dashboard/components/FullScreenMessage'
import { CompetitionEditPage } from '@/modules/competitions/pages/CompetitionEditPage'

export default function CompetitionEditRoute() {
  const params = useParams<{ competitionId: string }>()
  const competitionIdParam = params?.competitionId
  const competitionId = Array.isArray(competitionIdParam) ? competitionIdParam[0] : competitionIdParam ?? ''
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') ?? `/competitions/${competitionId}/edit`
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

  return <CompetitionEditPage currentUser={user} competitionId={competitionId} />
}
