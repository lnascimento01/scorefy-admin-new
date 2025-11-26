'use client'

import type { MatchControlTeamInfo } from '../types'
import { useI18n } from '@/lib/i18n'
import { Clock3 } from 'lucide-react'
import { MatchClock } from './MatchClock'

interface ScoreBoardProps {
  home: MatchControlTeamInfo
  away: MatchControlTeamInfo
  periodLabel: string
  statusLabel?: string
  competitionName?: string
  onEditClock?: () => void
  matchId: string
}

export function ScoreBoard({
  home,
  away,
  periodLabel,
  statusLabel,
  competitionName,
  onEditClock,
  matchId
}: ScoreBoardProps) {
  const { dictionary } = useI18n()
  const labels = dictionary.matchControl.scoreboard
  const competitionLabel = competitionName ?? dictionary.matchControl.header.title
  return (
    <section className="card flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-textSecondary">
        <span className="text-sm font-semibold text-textPrimary">{competitionLabel}</span>
        {statusLabel && (
          <span className="inline-flex items-center gap-2 rounded-full border border-borderSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-textPrimary">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            {statusLabel}
          </span>
        )}
      </div>
      <div className="grid w-full grid-cols-[0.45fr_auto_0.45fr] items-center gap-4 md:gap-6">
        <TeamInfo team={home} align="end" />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-wide text-textSecondary">{labels.matchTime}</p>
          <MatchClock matchId={matchId} />
          {onEditClock && (
            <button
              type="button"
              onClick={onEditClock}
              className="inline-flex items-center justify-center rounded-full border border-secondary/40 bg-secondary/10 p-2 text-secondary transition hover:bg-secondary/20"
              aria-label={labels.editLabel}
            >
              <Clock3 className="h-4 w-4" />
            </button>
          )}
          <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary">
            {labels.periodLabel}: {periodLabel}
          </p>
        </div>
        <TeamInfo team={away} align="start" />
      </div>
    </section>
  )
}

function TeamInfo({ team, align }: { team: MatchControlTeamInfo; align: 'start' | 'end' }) {
  return (
    <div className={align === 'end' ? 'text-right' : 'text-left'}>
      <p className="text-xs uppercase tracking-wide text-textSecondary">{team.shortName ?? team.name}</p>
      <p className="text-4xl font-bold text-textPrimary md:text-5xl">{team.score}</p>
      <p className="text-sm text-textSecondary">{team.name}</p>
    </div>
  )
}
