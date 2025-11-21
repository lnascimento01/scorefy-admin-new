'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DashboardGateway } from '../services/dashboard.service'
import { DashboardAlertType, DashboardDataSource, DashboardSnapshot } from '../types'

interface UseDashboardDataResult {
  snapshot: DashboardSnapshot | null
  alerts: DashboardAlertType[]
  source: DashboardDataSource
  isLoading: boolean
  isRefreshing: boolean
  refetch: () => Promise<void>
}

export function useDashboardData(): UseDashboardDataResult {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlertType[]>([])
  const [source, setSource] = useState<DashboardDataSource>('mock')
  const [status, setStatus] = useState<'idle' | 'loading' | 'refreshing'>('idle')
  const hasLoadedRef = useRef(false)

  const load = useCallback(async () => {
    setStatus(hasLoadedRef.current ? 'refreshing' : 'loading')
    const result = await DashboardGateway.fetchSnapshot()
    setSnapshot(result.data)
    setAlerts(result.alerts)
    setSource(result.source)
    hasLoadedRef.current = true
    setStatus('idle')
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- we intentionally kick off the first async fetch here.
    load().catch(() => undefined)
  }, [load])

  const derived = useMemo(
    () => ({
      isLoading: !snapshot && status === 'loading',
      isRefreshing: Boolean(snapshot) && status === 'refreshing'
    }),
    [snapshot, status],
  )

  return {
    snapshot,
    alerts,
    source,
    isLoading: derived.isLoading,
    isRefreshing: derived.isRefreshing,
    refetch: load
  }
}
