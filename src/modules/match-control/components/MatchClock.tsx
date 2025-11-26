'use client'

import { useMemo } from 'react'
import { PauseCircle, PlayCircle } from 'lucide-react'
import { useMatchClock } from '../hooks/useMatchClock'

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function MatchClock({ matchId }: { matchId: string | number }) {
  const { seconds, isRunning } = useMatchClock(matchId)

  const statusLabel = useMemo(() => (isRunning ? 'Rodando' : 'Pausado'), [isRunning])
  const StatusIcon = isRunning ? PlayCircle : PauseCircle

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="rounded-2xl border border-borderSoft bg-surface-muted px-6 py-3">
        <span className="font-mono text-5xl font-semibold tracking-wide text-textPrimary md:text-6xl">
          {formatClock(seconds)}
        </span>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-borderSoft/80 bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-textSecondary">
        <StatusIcon className="h-4 w-4" />
        {statusLabel}
      </div>
    </div>
  )
}
