'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MatchControlParticipant, MatchSide } from '../types'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Search } from 'lucide-react'
import type { ActiveSuspension } from '../utils/suspensions'
import { formatClock } from '../utils/time'

export interface PlayerEventAction {
  id: string
  label: string
  typeCode: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning' | 'info'
}

interface PlayerGridProps {
  title: string
  participants: MatchControlParticipant[]
  side: MatchSide
  actions: PlayerEventAction[]
  onTriggerEvent: (playerId: string, action: PlayerEventAction) => void
  suspensionsByPlayerId?: Record<string, ActiveSuspension>
  disabled?: boolean
}

export function PlayerGrid({ title, participants, side, actions, onTriggerEvent, suspensionsByPlayerId, disabled }: PlayerGridProps) {
  const { dictionary } = useI18n()
  const copy = dictionary.matchControl.roster
  const actionableParticipants = participants.filter((participant) => !participant.isStaff)
  const [query, setQuery] = useState('')
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const primaryActions = useMemo(() => {
    const preferredOrder = ['goal', 'two-minutes', 'seven-meter', 'seven_meter_scored']
    const matches = preferredOrder
      .map((token) => actions.find((action) => isPreferredAction(action, token)))
      .filter((action): action is PlayerEventAction => Boolean(action))
    if (matches.length) return matches
    return actions.slice(0, Math.min(actions.length, 2))
  }, [actions])

  const overflowActions = useMemo(
    () => actions.filter((action) => !primaryActions.some((primary) => primary.id === action.id)),
    [actions, primaryActions]
  )

  const filteredParticipants = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return actionableParticipants
    return actionableParticipants.filter((participant) => {
      const shirtNumber = typeof participant.shirtNumber === 'number' ? String(participant.shirtNumber) : ''
      return [participant.name, participant.nick, participant.position, shirtNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    })
  }, [actionableParticipants, query])

  const countLabel = copy.count.replace('{count}', String(filteredParticipants.length))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setActivePlayerId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!activePlayerId) return
    if (filteredParticipants.some((participant) => participant.id === activePlayerId)) return
    setActivePlayerId(null)
  }, [activePlayerId, filteredParticipants])

  useEffect(() => {
    if (!selectedPlayerId) return
    if (filteredParticipants.some((participant) => participant.id === selectedPlayerId)) return
    setSelectedPlayerId(null)
  }, [filteredParticipants, selectedPlayerId])

  const toggleMenu = (playerId: string) => {
    if (disabled) return
    setActivePlayerId((prev) => (prev === playerId ? null : playerId))
  }

  const handleActionClick = (playerId: string, action: PlayerEventAction) => {
    setSelectedPlayerId(playerId)
    onTriggerEvent(playerId, action)
    setActivePlayerId(null)
  }

  return (
    <section className="card flex flex-col gap-2.5 p-3" ref={containerRef}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-textSecondary">{title}</h3>
        </div>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-semibold text-textSecondary">
          {countLabel}
        </span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar atleta"
          className="h-9 rounded-xl border-borderSoft/80 bg-surface-muted pl-9 text-sm text-textPrimary placeholder:text-textSecondary/70"
        />
      </div>
      <div className="space-y-0.5 pr-1">
        {filteredParticipants.map((participant) => {
          const isOpen = activePlayerId === participant.id
          const isSelected = selectedPlayerId === participant.id
          const suspension = suspensionsByPlayerId?.[participant.id] ?? null
          const isSuspended = Boolean(suspension)
          const suspensionTooltip = suspension
            ? `Atleta suspenso por 2 minutos • ${formatClock(suspension.remainingSeconds)}`
            : 'Atleta suspenso por 2 minutos'
          return (
            <div
              key={`${participant.id}-${side}`}
              className={cn(
                'relative border-b border-borderSoft/40 px-2 py-1.5 transition last:border-b-0',
                isSelected && 'bg-secondary/10'
              )}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-md text-left transition',
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-surface-muted/70'
                  )}
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedPlayerId(participant.id)
                  }}
                  disabled={disabled}
                  aria-haspopup={overflowActions.length ? 'true' : undefined}
                  aria-expanded={overflowActions.length ? isOpen : undefined}
                  title={participant.name}
                >
                  {typeof participant.shirtNumber === 'number' ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-borderSoft/60 bg-surface px-1.5 text-[10px] font-semibold text-textSecondary">
                      #{participant.shirtNumber}
                    </span>
                  ) : (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-borderSoft/60 bg-surface px-1.5 text-[10px] font-semibold text-textSecondary">
                      •
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-textPrimary">
                    {participant.name}
                  </span>
                </button>

                {isSuspended && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200"
                    title={suspensionTooltip}
                  >
                    <span>2’</span>
                    <span className="font-mono text-amber-50">{formatClock(suspension?.remainingSeconds ?? 0)}</span>
                  </span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  {primaryActions.map((action) => {
                    const goalLocked = action.id === 'goal' && isSuspended
                    const actionTitle = goalLocked ? suspensionTooltip : action.label

                    return (
                      <Button
                        key={`${participant.id}-${action.id}`}
                        type="button"
                        size="sm"
                        variant={action.variant === 'primary' ? 'primary' : action.variant === 'danger' ? 'danger' : 'outline'}
                        disabled={disabled}
                        title={actionTitle}
                        aria-label={action.label}
                        aria-disabled={goalLocked ? 'true' : undefined}
                        className={cn(
                          'h-6 min-w-0 rounded-full px-2 text-[10px] font-semibold leading-none',
                          action.variant === 'primary' && 'border-transparent bg-primary/15 text-primary hover:bg-primary/25',
                          action.variant === 'danger' && 'border-transparent bg-rose-500/20 text-rose-200 hover:bg-rose-500/30',
                          action.variant === 'warning' && 'border-transparent bg-amber-500/20 text-amber-200 hover:bg-amber-500/30',
                          action.variant === 'info' && 'border-transparent bg-sky-500/20 text-sky-200 hover:bg-sky-500/30',
                          action.variant === 'secondary' && 'border-transparent bg-secondary/20 text-secondary hover:bg-secondary/30',
                          goalLocked && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleActionClick(participant.id, action)
                        }}
                        disabled={disabled || goalLocked}
                      >
                        {shortActionLabel(action)}
                      </Button>
                    )
                  })}
                  {overflowActions.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
                      className="h-6 w-6 rounded-full p-0 text-textSecondary"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleMenu(participant.id)
                      }}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      aria-label="Mais ações"
                      title="Mais ações"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {isOpen && overflowActions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-borderSoft/80 bg-[var(--surface-elevated-strong)] p-2 shadow-2xl">
                  <div className="grid gap-1 sm:grid-cols-2">
                    {overflowActions.map((action) => {
                      const goalLocked = action.id === 'goal' && isSuspended
                      const actionTitle = goalLocked ? suspensionTooltip : action.label

                      return (
                      <Button
                        key={`${participant.id}-${action.id}`}
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                          'h-8 w-full justify-start rounded-md border-borderSoft/60 bg-transparent text-[11px] font-semibold text-textSecondary hover:text-textPrimary',
                          action.variant === 'primary' && 'border-transparent bg-primary/15 text-primary hover:bg-primary/25',
                          action.variant === 'danger' && 'border-transparent bg-rose-500/20 text-rose-200 hover:bg-rose-500/30',
                          action.variant === 'warning' && 'border-transparent bg-amber-500/20 text-amber-200 hover:bg-amber-500/30',
                          action.variant === 'info' && 'border-transparent bg-sky-500/20 text-sky-200 hover:bg-sky-500/30',
                          action.variant === 'secondary' && 'border-transparent bg-secondary/20 text-secondary hover:bg-secondary/30',
                          goalLocked && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleActionClick(participant.id, action)
                        }}
                        title={actionTitle}
                        disabled={disabled || goalLocked}
                      >
                        {action.label}
                      </Button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {!actionableParticipants.length && (
          <div className="rounded-xl border border-dashed border-borderSoft p-6 text-center text-sm text-textSecondary">
            {copy.empty}
          </div>
        )}
        {!filteredParticipants.length && actionableParticipants.length > 0 && (
          <div className="rounded-xl border border-dashed border-borderSoft p-6 text-center text-sm text-textSecondary">
            Nenhum atleta corresponde à busca.
          </div>
        )}
        {selectedPlayerId && (
          <div className="rounded-lg border border-borderSoft/50 bg-surface-muted/80 px-3 py-2 text-[11px] text-textSecondary">
            <span className="uppercase tracking-[0.18em]">Selecionado:</span>{' '}
            <span className="font-semibold text-textPrimary">
              {filteredParticipants.find((participant) => participant.id === selectedPlayerId)?.name ?? '—'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function shortActionLabel(action: PlayerEventAction): string {
  if (action.id === 'goal') return 'Gol'
  if (action.id === 'two-minutes') return "2'"
  if (action.id === 'yellow-card') return 'Am'
  if (action.id === 'red-card') return 'V'
  if (action.id === 'blue-card') return 'Az'
  return action.label
}

function isPreferredAction(action: PlayerEventAction, token: string): boolean {
  const normalized = `${action.id} ${action.typeCode} ${action.label}`.toLowerCase()
  return normalized.includes(token)
}
