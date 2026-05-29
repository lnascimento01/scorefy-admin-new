'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { MatchSummary } from '../types'
import { formatMatchStatusLabel, getMatchStatusVariant } from '../utils/status'
import { MatchActionsMenu, type BusyAction } from './MatchActionsMenu'

interface MatchesTableProps {
  matches: MatchSummary[]
  loading?: boolean
  onTransitionAction?: (match: MatchSummary, action: import('../utils/status').MatchTransitionAction) => void
  onOpenRoster?: (match: MatchSummary) => void
  onOpenEvents?: (match: MatchSummary) => void
  onOpenScoresheet?: (match: MatchSummary) => void
  onEdit?: (match: MatchSummary) => void
  actionState?: { matchId: string; action: BusyAction } | null
}

export function MatchesTable({
  matches,
  loading,
  onTransitionAction,
  onOpenRoster,
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
          const statusLabel = formatMatchStatusLabel(match.status)
          const statusVariant = getMatchStatusVariant(match.status)

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
              <TableCell className="relative overflow-visible text-right">
                <MatchActionsMenu
                  match={match}
                  onTransitionAction={onTransitionAction}
                  onOpenRoster={onOpenRoster}
                  onOpenEvents={onOpenEvents}
                  onOpenScoresheet={onOpenScoresheet}
                  onEdit={onEdit}
                  actionState={actionState}
                />
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
