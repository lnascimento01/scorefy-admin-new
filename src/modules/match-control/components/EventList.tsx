'use client'

import { Activity } from 'lucide-react'
import type { MatchControlEvent } from '../types'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

interface EventListProps {
  events: MatchControlEvent[]
  loading?: boolean
  className?: string
}

export function EventList({ events, loading, className }: EventListProps) {
  const { dictionary } = useI18n()
  const copy = dictionary.matchControl.timeline
  return (
    <section className={cn('card flex flex-col gap-4 p-6', className)}>
      <div>
        <h2 className="text-xl font-semibold text-textPrimary">{copy.title}</h2>
        <p className="text-sm text-textSecondary">{copy.description}</p>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {loading && events.length === 0 && (
          <div className="rounded-xl border border-dashed border-borderSoft p-6 text-center text-sm text-textSecondary">
            {copy.loading}
          </div>
        )}
        {!loading && events.length === 0 && (
          <div className="rounded-xl border border-dashed border-borderSoft p-6 text-center text-sm text-textSecondary">
            {copy.empty}
          </div>
        )}
        {events.map((event) => (
          <article
            key={event.id}
            className="flex items-center gap-3 rounded-2xl border border-borderSoft/60 bg-surface-muted px-4 py-3 text-sm text-textPrimary"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{event.description}</p>
              <div className="text-xs text-textSecondary">
                {event.matchTimeLabel ?? '--:--'}
                {event.playerName && ` • ${event.playerName}`}
              </div>
            </div>
            <div className="text-xs uppercase tracking-wide text-textSecondary">
              {event.team === 'home'
                ? dictionary.matchControl.labels.homeTeam
                : event.team === 'away'
                  ? dictionary.matchControl.labels.awayTeam
                  : ''}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
