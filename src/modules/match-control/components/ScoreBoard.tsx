'use client'

import type { MatchControlTeamInfo } from '../types'
import type { MatchClockState } from '../hooks/useMatchClock'
import { useI18n } from '@/lib/i18n'
import { Clock3 } from 'lucide-react'
import { MatchClock } from './MatchClock'
import { cn } from '@/lib/utils/cn'
import type { ActiveSuspension } from '../utils/suspensions'
import { formatClock } from '../utils/time'

type SuspensionDisplayItem = ActiveSuspension & { displayLabel?: string }

interface ScoreBoardProps {
  home: MatchControlTeamInfo
  away: MatchControlTeamInfo
  periodLabel: string
  statusLabel?: string
  competitionName?: string
  onEditClock?: () => void
  clockState: MatchClockState
  homeSuspensions?: SuspensionDisplayItem[]
  awaySuspensions?: SuspensionDisplayItem[]
  variant?: 'default' | 'compact'
}

export function ScoreBoard({
  home,
  away,
  periodLabel,
  statusLabel,
  competitionName,
  onEditClock,
  clockState,
  homeSuspensions = [],
  awaySuspensions = [],
  variant = 'default'
}: ScoreBoardProps) {
  const { dictionary } = useI18n()
  const labels = dictionary.matchControl.scoreboard
  const competitionLabel = competitionName ?? dictionary.matchControl.header.title
  const isCompact = variant === 'compact'
  return (
    <section className={cn('card flex flex-col gap-2', isCompact ? 'p-3' : 'p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-textSecondary">
        <span className={cn('truncate font-semibold text-textPrimary', isCompact ? 'text-xs' : 'text-sm')}>{competitionLabel}</span>
        {statusLabel && (
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-borderSoft px-2 py-0.5 font-semibold uppercase tracking-[0.18em] text-textPrimary',
            isCompact ? 'text-[10px]' : 'text-[11px]'
          )}>
            <span className={cn('rounded-full bg-secondary', isCompact ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
            {statusLabel}
          </span>
        )}
      </div>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:gap-4">
        <TeamInfo team={home} align="end" suspensions={homeSuspensions} />
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[9px] uppercase tracking-[0.24em] text-textSecondary">{labels.matchTime}</p>
          <MatchClock state={clockState} variant="compact" />
          {onEditClock && (
            <button
              type="button"
              onClick={onEditClock}
              className="inline-flex items-center justify-center rounded-full border border-secondary/40 bg-secondary/10 p-1.5 text-secondary transition hover:bg-secondary/20"
              aria-label={labels.editLabel}
            >
              <Clock3 className="h-3.5 w-3.5" />
            </button>
          )}
          <p className="text-[9px] font-semibold uppercase tracking-wide text-textSecondary">
            {labels.periodLabel}: {periodLabel}
          </p>
        </div>
        <TeamInfo team={away} align="start" suspensions={awaySuspensions} />
      </div>
    </section>
  )
}

function TeamInfo({
  team,
  align,
  suspensions
}: {
  team: MatchControlTeamInfo
  align: 'start' | 'end'
  suspensions: SuspensionDisplayItem[]
}) {
  return (
    <div className={cn('min-w-0 space-y-2', align === 'end' ? 'text-right' : 'text-left')}>
      <SuspensionList suspensions={suspensions} align={align} />
      <div className={cn('flex items-baseline gap-2', align === 'end' ? 'justify-end' : 'justify-start')}>
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-textSecondary">
          {team.shortName ?? team.name}
        </p>
        <p className="text-3xl font-bold leading-none text-textPrimary md:text-[2.35rem]">{team.score}</p>
      </div>
      <p className="truncate text-[11px] text-textSecondary md:text-xs" title={team.name}>
        {team.name}
      </p>
    </div>
  )
}

function SuspensionList({ suspensions, align }: { suspensions: SuspensionDisplayItem[]; align: 'start' | 'end' }) {
  if (!suspensions.length) {
    return null
  }

  const visible = suspensions.slice(0, 4)
  const overflow = suspensions.length - visible.length

  return (
    <div className={cn('flex flex-col gap-1 text-[10px] font-semibold leading-tight text-amber-100', align === 'end' ? 'items-end' : 'items-start')}>
      {visible.map((suspension) => (
        <div
          key={`${suspension.playerId}-${suspension.eventId}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5"
          title={suspension.displayLabel ?? suspension.playerName ?? 'Atleta suspenso por 2 minutos'}
        >
          <span className="shrink-0 text-amber-200">2’</span>
          <span className="truncate text-textPrimary">
            {suspension.displayLabel ?? suspension.playerName ?? 'Atleta'}
          </span>
          <span className="shrink-0 font-mono text-amber-100/90">
            {formatClock(suspension.remainingSeconds)}
          </span>
        </div>
      ))}
      {overflow > 0 && (
        <span className={cn('text-[9px] font-semibold uppercase tracking-[0.18em] text-textSecondary', align === 'end' ? 'text-right' : 'text-left')}>
          +{overflow}
        </span>
      )}
    </div>
  )
}
