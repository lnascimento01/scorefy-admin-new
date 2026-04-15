'use client'

import { useMemo, useState } from 'react'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { PlayerCatalogOption, PlayerSummary } from '../types'

interface PlayerTransferModalProps {
  open: boolean
  player: PlayerSummary | null
  teams: PlayerCatalogOption[]
  submitting?: boolean
  error?: string | null
  onConfirm: (teamId: string) => void
  onCancel: () => void
}

export function PlayerTransferModal({
  open,
  player,
  teams,
  submitting,
  error,
  onConfirm,
  onCancel,
}: PlayerTransferModalProps) {
  const [teamId, setTeamId] = useState('')

  const availableTeams = useMemo(
    () => teams.filter((team) => team.id !== player?.teamId),
    [player?.teamId, teams],
  )
  const selectedTeamId = teamId && availableTeams.some((team) => team.id === teamId)
    ? teamId
    : (availableTeams[0]?.id ?? '')

  if (!open || !player) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-borderSofter bg-surface-contrast p-6 shadow-popover">
        <div className="space-y-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-elevated text-textPrimary">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-textPrimary">Transferir atleta</h3>
          <p className="text-sm text-textSecondary">
            Atualize a equipe base de <strong className="text-textPrimary">{player.fullName}</strong> sem alterar inscrições sazonais automaticamente.
          </p>
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl border border-borderSofter bg-surface-elevated/60 p-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-textSecondary">Equipe atual</p>
            <p className="font-semibold text-textPrimary">{player.team?.name ?? 'Sem equipe base'}</p>
          </div>
          <label className="space-y-1 text-sm">
            <span className="text-textSecondary">Nova equipe</span>
            <Select
              value={selectedTeamId}
              onChange={(event) => setTeamId(event.target.value)}
              disabled={submitting || availableTeams.length === 0}
            >
              <option value="">Selecione</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.secondaryLabel ? `${team.label} • ${team.secondaryLabel}` : team.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        {availableTeams.length === 0 && !error && (
          <p className="mt-4 text-sm text-textSecondary">Não há outra equipe disponível para transferência.</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onConfirm(selectedTeamId)}
            disabled={submitting || !selectedTeamId}
            className="gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            Confirmar transferência
          </Button>
        </div>
      </div>
    </div>
  )
}
