'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { FullScreenMessage } from '@/modules/dashboard/components/FullScreenMessage'
import { StatsPage } from '@/modules/stats/pages/StatsPage'

export default function StatsRoute() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams.get('from') ?? '/stats'
  const { dictionary } = useI18n()

  useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(fromParam)
      router.replace(`/login?from=${redirect}`)
    }
  }, [fromParam, loading, router, user])

  if (loading || !user) {
    return <FullScreenMessage title={dictionary.auth.verifying} />
  }

  return <StatsPage currentUser={user} />
}
