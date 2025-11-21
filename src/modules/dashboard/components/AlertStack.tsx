'use client'

import { AlertTriangle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { DashboardAlertType } from '../types'

interface AlertStackProps {
  alerts: DashboardAlertType[]
}

export function AlertStack({ alerts }: AlertStackProps) {
  const { dictionary } = useI18n()
  if (!alerts.length) return null
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert}
          className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-100"
        >
          <AlertTriangle className="h-4 w-4 text-amber-200" />
          <span>{dictionary.dashboard.alerts[alert]}</span>
        </div>
      ))}
    </div>
  )
}
