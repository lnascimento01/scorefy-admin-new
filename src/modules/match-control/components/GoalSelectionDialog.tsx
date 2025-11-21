'use client'

import { motion } from 'framer-motion'
import type { MatchControlParticipant, MatchQuickAction, MatchSide } from '../types'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

interface GoalSelectionDialogProps {
  open: boolean
  action: MatchQuickAction | null
  players: MatchControlParticipant[]
  team: MatchSide | null
  onSelect: (playerId: string) => void
  onClose: () => void
}

export function GoalSelectionDialog({ open, action, players, team, onSelect, onClose }: GoalSelectionDialogProps) {
  const { dictionary } = useI18n()
  const copy = dictionary.matchControl.goalDialog
  if (!open || !action || !team) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl bg-[var(--surface)] p-6 shadow-2xl"
      >
        <div className="mb-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-textSecondary">{copy.title}</p>
          <h3 className="text-lg font-semibold text-textPrimary">{action.label}</h3>
          <p className="text-sm text-textSecondary">{copy.description}</p>
        </div>
        <div className="grid max-h-[360px] gap-3 overflow-y-auto md:grid-cols-2">
          {players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onSelect(player.id)}
              className="flex flex-col rounded-xl border border-borderSoft/70 bg-surface-muted px-4 py-3 text-left transition hover:border-secondary"
            >
              <span className="text-sm font-semibold text-textPrimary">{player.name}</span>
              {(player.role || player.position) && (
                <span className="text-xs text-textSecondary">{player.role ?? player.position}</span>
              )}
            </button>
          ))}
          {!players.length && (
            <div className="rounded-xl border border-dashed border-borderSoft p-6 text-center text-sm text-textSecondary">
              {copy.empty}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {copy.cancel}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
