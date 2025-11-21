'use client'

import { useEffect, useRef, useState } from 'react'
import type { MatchControlParticipant, MatchSide } from '../types'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

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
  disabled?: boolean
}

export function PlayerGrid({ title, participants, side, actions, onTriggerEvent, disabled }: PlayerGridProps) {
  const { dictionary } = useI18n()
  const copy = dictionary.matchControl.roster
  const actionableParticipants = participants.filter((participant) => !participant.isStaff)
  const countLabel = copy.count.replace('{count}', String(actionableParticipants.length))
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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

  const toggleMenu = (playerId: string) => {
    if (disabled) return
    setActivePlayerId((prev) => (prev === playerId ? null : playerId))
  }

  const handleActionClick = (playerId: string, action: PlayerEventAction) => {
    onTriggerEvent(playerId, action)
    setActivePlayerId(null)
  }

  return (
    <section className="card flex flex-col gap-4 p-5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-textPrimary">{title}</h3>
          <p className="text-xs text-textSecondary">{copy.subtitle}</p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-textSecondary">
          {countLabel}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {actionableParticipants.map((participant) => {
          const isOpen = activePlayerId === participant.id
          return (
            <div key={`${participant.id}-${side}`} className="relative rounded-xl border border-borderSoft/60 bg-surface-muted">
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition',
                  disabled ? 'opacity-60' : 'hover:bg-surface-muted/80'
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleMenu(participant.id)
                }}
                disabled={disabled}
                aria-haspopup="true"
                aria-expanded={isOpen}
              >
                <div>
                  <p className="text-sm font-semibold text-textPrimary">{participant.name}</p>
                  <p className="text-[10px] uppercase tracking-wide text-textSecondary">
                    {participant.position ?? copy.playerLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {typeof participant.shirtNumber === 'number' && (
                    <span className="text-lg font-semibold text-textSecondary">#{participant.shirtNumber}</span>
                  )}
                  <span className="text-[10px] text-textSecondary">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="absolute left-0 right-0 z-10 mt-1 rounded-xl border border-borderSoft/80 bg-[var(--surface-elevated-strong)] p-3 shadow-2xl">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-textSecondary">{copy.actionsLabel}</p>
                  <div className="flex flex-col gap-1.5">
                    {actions.map((action) => (
                      <Button
                        key={`${participant.id}-${action.id}`}
                        size="sm"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                          'w-full justify-start rounded-lg border-borderSoft/60 bg-transparent text-[11px] font-semibold text-textSecondary hover:text-textPrimary',
                          action.variant === 'primary' && 'border-transparent bg-primary/15 text-primary hover:bg-primary/25',
                          action.variant === 'danger' && 'border-transparent bg-rose-500/20 text-rose-200 hover:bg-rose-500/30',
                          action.variant === 'warning' && 'border-transparent bg-amber-500/20 text-amber-200 hover:bg-amber-500/30',
                          action.variant === 'info' && 'border-transparent bg-sky-500/20 text-sky-200 hover:bg-sky-500/30',
                          action.variant === 'secondary' && 'border-transparent bg-secondary/20 text-secondary hover:bg-secondary/30'
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleActionClick(participant.id, action)
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
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
      </div>
    </section>
  )
}
