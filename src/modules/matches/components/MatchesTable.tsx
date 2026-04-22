'use client'

import { Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MatchSummary } from '../types'
import {
  formatMatchStatusLabel,
  getMatchActionCapabilities,
  getMatchPrimaryAction,
  getMatchStatusVariant,
  type MatchTransitionAction
} from '../utils/status'

interface MatchesTableProps {
  matches: MatchSummary[]
  loading?: boolean
  onTransitionAction?: (match: MatchSummary, action: MatchTransitionAction) => void
  onOpenEvents?: (match: MatchSummary) => void
  onOpenScoresheet?: (match: MatchSummary) => void
  onEdit?: (match: MatchSummary) => void
  actionState?: { matchId: string; action: MatchTransitionAction | 'scoresheet' } | null
}

export function MatchesTable({
  matches,
  loading,
  onTransitionAction,
  onOpenEvents,
  onOpenScoresheet,
  onEdit,
  actionState
}: MatchesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Mandante</TableHead>
          <TableHead>Visitante</TableHead>
          <TableHead>Placar</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && matches.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-textSecondary">
              Sincronizando partidas com o backend...
            </TableCell>
          </TableRow>
        )}
        {matches.map((match) => {
          const primaryAction = getMatchPrimaryAction(match.status)
          const statusLabel = formatMatchStatusLabel(match.status)
          const statusVariant = getMatchStatusVariant(match.status)
          const { canGenerateScoresheet } = getMatchActionCapabilities(match.status)
          const isRowBusy = actionState?.matchId === match.id

          return (
            <TableRow key={match.id}>
              <TableCell>
                <div>
                  <p className="font-semibold text-textPrimary">{match.dateLabel}</p>
                  <p className="text-xs text-textSecondary">{match.timeLabel}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold text-textPrimary">
                    {match.home.name}{' '}
                    {match.home.short && <span className="text-xs uppercase text-textSecondary">({match.home.short})</span>}
                  </p>
                  <p className="text-xs text-textSecondary">
                    {match.competitionName}
                    {match.competitionSeason ? ` • ${match.competitionSeason}` : ''}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-semibold text-textPrimary">
                    {match.away.name}{' '}
                    {match.away.short && <span className="text-xs uppercase text-textSecondary">({match.away.short})</span>}
                  </p>
                  <p className="text-xs text-textSecondary">{match.venue ?? 'Local indefinido'}</p>
                </div>
              </TableCell>
              <TableCell className="font-semibold text-textPrimary">{match.scoreLabel}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  {match.metaSlug && <span className="text-[10px] uppercase tracking-wide text-textSecondary/70">{match.metaSlug}</span>}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2 text-xs text-textSecondary">
                  {primaryAction && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!onTransitionAction || isRowBusy}
                      onClick={() => onTransitionAction?.(match, primaryAction.action)}
                    >
                      {isRowBusy && actionState?.action === primaryAction.action ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {primaryAction.loadingLabel}
                        </span>
                      ) : (
                        primaryAction.label
                      )}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onOpenEvents?.(match)} disabled={!onOpenEvents || isRowBusy}>
                    Eventos
                  </Button>
                  {canGenerateScoresheet && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenScoresheet?.(match)}
                      disabled={!onOpenScoresheet || isRowBusy}
                    >
                      {isRowBusy && actionState?.action === 'scoresheet' ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Gerando...
                        </span>
                      ) : (
                        'Súmula'
                      )}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => onEdit?.(match)} disabled={!onEdit || isRowBusy}>
                    Editar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
        {!loading && matches.length === 0 && (
          <TableRow>
            <TableCell colSpan={6}>
              <div className="flex flex-col items-center gap-3 py-10 text-center text-textSecondary">
                <p className="text-sm">Nenhuma partida encontrada para os filtros selecionados.</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
