'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { MatchSummary } from '../types'
import {
  getMatchActionCapabilities,
  getMatchPrimaryAction,
  type MatchTransitionAction
} from '../utils/status'

export type BusyAction = MatchTransitionAction | 'scoresheet' | null

interface MatchActionsMenuProps {
  match: MatchSummary
  onTransitionAction?: (match: MatchSummary, action: MatchTransitionAction) => void
  onOpenRoster?: (match: MatchSummary) => void
  onOpenEvents?: (match: MatchSummary) => void
  onOpenScoresheet?: (match: MatchSummary) => void
  onEdit?: (match: MatchSummary) => void
  actionState?: { matchId: string; action: BusyAction } | null
}

export function MatchActionsMenu({
  match,
  onTransitionAction,
  onOpenRoster,
  onOpenEvents,
  onOpenScoresheet,
  onEdit,
  actionState
}: MatchActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const primaryAction = getMatchPrimaryAction(match.status)
  const { canManageRoster, canGenerateScoresheet } = getMatchActionCapabilities(match.status)
  const isBusy = actionState?.matchId === match.id

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (isBusy) {
      setOpen(false)
    }
  }, [isBusy])

  const closeAndRun = (callback?: (match: MatchSummary) => void) => {
    setOpen(false)
    callback?.(match)
  }

  const triggerPrimaryAction = () => {
    setOpen(false)
    if (!primaryAction || !onTransitionAction) return
    onTransitionAction(match, primaryAction.action)
  }

  const triggerScoresheet = () => {
    setOpen(false)
    onOpenScoresheet?.(match)
  }

  return (
    <div ref={containerRef} className="relative inline-flex justify-end">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="gap-2"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
        Ações
      </Button>

      {open && (
        <div
          role="menu"
          aria-label={`Ações da partida ${match.home.name} contra ${match.away.name}`}
          className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] p-2 shadow-2xl"
        >
          <div className="space-y-1">
            {primaryAction && (
              <button
                type="button"
                role="menuitem"
                className={menuItemClass({ active: isBusy && actionState?.action === primaryAction.action })}
                onClick={triggerPrimaryAction}
                disabled={!onTransitionAction}
              >
                {isBusy && actionState?.action === primaryAction.action ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {primaryAction.loadingLabel}
                  </>
                ) : (
                  primaryAction.label
                )}
              </button>
            )}

            {canManageRoster && onOpenRoster && (
              <button type="button" role="menuitem" className={menuItemClass()} onClick={() => closeAndRun(onOpenRoster)}>
                Gerenciar partida
              </button>
            )}

            {onOpenEvents && (
              <button type="button" role="menuitem" className={menuItemClass()} onClick={() => closeAndRun(onOpenEvents)}>
                Eventos
              </button>
            )}

            {canGenerateScoresheet && onOpenScoresheet && (
              <button type="button" role="menuitem" className={menuItemClass({ active: isBusy && actionState?.action === 'scoresheet' })} onClick={triggerScoresheet}>
                {isBusy && actionState?.action === 'scoresheet' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Súmula'
                )}
              </button>
            )}

            {onEdit && (
              <button type="button" role="menuitem" className={menuItemClass()} onClick={() => closeAndRun(onEdit)}>
                Editar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function menuItemClass(options?: { active?: boolean }) {
  return cn(
    'flex h-9 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-textSecondary transition hover:bg-surface-muted hover:text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
    options?.active && 'cursor-wait opacity-75'
  )
}
