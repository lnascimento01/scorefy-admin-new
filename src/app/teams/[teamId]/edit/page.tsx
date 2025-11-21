'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { FullScreenMessage } from '@/modules/dashboard/components/FullScreenMessage'
import { TeamEditPage } from '@/modules/teams/pages/TeamEditPage'

export default function TeamEditRoute() {
  const params = useParams<{ teamId: string }>()
  const teamIdParam = params?.teamId
  const teamId = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam ?? ''
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') ?? `/teams/${teamId}/edit`
  const { dictionary } = useI18n()

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(fromParam)
      router.replace(`/login?from=${redirect}`)
    }
  }, [fromParam, loading, router, user])

  if (loading || !user || !teamId) {
    return <FullScreenMessage title={dictionary.auth.verifying} />
  }

  return <TeamEditPage currentUser={user} teamId={teamId} />
}
