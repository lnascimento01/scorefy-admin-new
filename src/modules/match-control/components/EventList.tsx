'use client'

import { useState } from 'react'
import type { MatchControlEvent } from '../types'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import { normalizeMatchEventTypeLabel } from '../utils/normalizers'

interface EventListProps {
  events: MatchControlEvent[]
  loading?: boolean
  className?: string
  onDeleteEvent?: (event: MatchControlEvent) => void
  canDeleteEvents?: boolean
}

export function EventList({ events, loading, className, onDeleteEvent, canDeleteEvents = true }: EventListProps) {
  const { dictionary } = useI18n()
  const copy = dictionary.matchControl.timeline
  const [deleteTarget, setDeleteTarget] = useState<MatchControlEvent | null>(null)
  return (
    <section className={cn('card flex min-h-0 flex-col gap-2.5 p-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-textSecondary">{copy.title}</h2>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-semibold text-textSecondary">
          {events.length}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 pr-1 xl:overflow-y-auto">
        <div className="grid grid-cols-[58px_72px_minmax(0,1fr)_78px_24px] gap-2 px-2 text-[10px] uppercase tracking-[0.16em] text-textSecondary">
          <span>Tempo</span>
          <span>Tipo</span>
          <span>Atleta</span>
          <span>Time</span>
          <span />
        </div>
        {loading && events.length === 0 && (
          <div className="rounded-lg border border-dashed border-borderSoft p-4 text-center text-sm text-textSecondary">
            {copy.loading}
          </div>
        )}
        {!loading && events.length === 0 && (
          <div className="rounded-lg border border-dashed border-borderSoft p-4 text-center text-sm text-textSecondary">
            {copy.empty}
          </div>
        )}
        <div className="space-y-0.5 xl:flex-1 xl:min-h-0">
          {events.map((event) => {
            const typeLabel =
              normalizeMatchEventTypeLabel(event.typeCode ?? null, {
                type_name: event.typeName,
                typeName: event.typeName,
                label: event.description,
                name: event.description,
                event_label: event.description
              }) ??
              event.typeName ??
              'Evento'
            return (
              <article
                key={event.id}
                className="grid grid-cols-[58px_72px_minmax(0,1fr)_78px_24px] items-center gap-2 rounded-md border-b border-borderSoft/40 px-2 py-1.5 text-sm text-textPrimary last:border-b-0"
              >
                <div className="font-mono text-[11px] font-semibold text-textPrimary">
                  {event.matchTimeLabel ?? '--:--'}
                </div>
                <div
                  className="min-w-0 truncate text-[11px] uppercase tracking-[0.16em] text-textSecondary"
                  title={typeLabel}
                >
                  {typeLabel}
                </div>
                <div
                  className="min-w-0 truncate text-[12px] font-semibold leading-tight text-textPrimary"
                  title={event.playerName ?? event.description}
                >
                  {event.playerName ?? event.description}
                </div>
                <div className="flex justify-start">
                  {event.team && (
                    <span className="inline-flex rounded-full border border-borderSoft/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-textSecondary">
                      {event.team === 'home'
                        ? dictionary.matchControl.labels.homeTeam
                        : event.team === 'away'
                          ? dictionary.matchControl.labels.awayTeam
                          : ''}
                    </span>
                  )}
                </div>
                {onDeleteEvent && canDeleteEvents ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 shrink-0 rounded-full p-0 text-textSecondary hover:text-danger"
                    onClick={() => setDeleteTarget(event)}
                    aria-label="Remover evento"
                    title="Remover evento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <div />
                )}
              </article>
            )
          })}
        </div>
      </div>
      {deleteTarget && onDeleteEvent && canDeleteEvents && (
        <ConfirmModal
          open
          title="Remover evento"
          description="Tem certeza de que deseja remover este evento? O placar e a linha do tempo serão atualizados."
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDeleteEvent(deleteTarget)
            setDeleteTarget(null)
          }}
        />
      )}
    </section>
  )
}
