'use client'

import { useMemo } from 'react'
import { PauseCircle, PlayCircle } from 'lucide-react'
import type { MatchClockState } from '../hooks/useMatchClock'
import { cn } from '@/lib/utils/cn'

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function MatchClock({ state, variant = 'default' }: { state: MatchClockState; variant?: 'default' | 'compact' }) {
  const { seconds, isRunning } = state
  const statusLabel = useMemo(() => (isRunning ? 'Rodando' : 'Pausado'), [isRunning])
  const StatusIcon = isRunning ? PlayCircle : PauseCircle
  const isCompact = variant === 'compact'

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="rounded-xl border border-borderSoft bg-surface-muted px-3 py-1.5 md:px-4 md:py-2">
        <span className={cn(
          'font-mono font-semibold tracking-wide text-textPrimary',
          isCompact ? 'text-2xl md:text-3xl' : 'text-4xl md:text-6xl'
        )}>
          {formatClock(seconds)}
        </span>
      </div>
      <div className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-borderSoft/80 bg-surface px-2.5 py-0.5 font-semibold uppercase tracking-wide text-textSecondary',
        isCompact ? 'text-[10px]' : 'text-[11px]'
      )}>
        <StatusIcon className={cn(isCompact ? 'h-3 w-3' : 'h-4 w-4')} />
        {statusLabel}
      </div>
    </div>
  )
}
