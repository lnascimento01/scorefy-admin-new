'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PaginationControls } from '@/components/PaginationControls'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { MatchesFilters } from '../components/MatchesFilters'
import { MatchesTable } from '../components/MatchesTable'
import { useMatches } from '../hooks/useMatches'
import { MatchesGateway } from '../services/matches.service'
import type { MatchSummary } from '../types'
import { resolveMatchActionError } from '../utils/errors'
import type { MatchTransitionAction } from '../utils/status'

const MATCH_CONTROL_BASE_PATH = (process.env.NEXT_PUBLIC_MATCH_CONTROL_BASE_PATH ?? '/matches').replace(/\/$/, '')

type ListActionState = { matchId: string; action: MatchTransitionAction | 'scoresheet' } | null

const actionFallbackMessages: Record<MatchTransitionAction, string> = {
  start: 'Não foi possível iniciar a partida. Verifique o status e tente novamente.',
  pause: 'Não foi possível pausar a partida. Verifique o status e tente novamente.',
  resume: 'Não foi possível retomar a partida. Verifique o status e tente novamente.',
  startNextPeriod: 'Não foi possível iniciar o segundo tempo. Verifique o status e tente novamente.'
}

export function MatchesPage({ currentUser }: { currentUser: AuthProfile }) {
  const {
    matches,
    meta,
    lastSync,
    loading,
    error,
    filters,
    setCompetitionFilter,
    setDateFilter,
    setStatusFilter,
    setSearchFilter,
    setPage,
    setPerPage,
    refetch
  } = useMatches()

  const router = useRouter()
  const [searchValue, setSearchValue] = useState(filters.search ?? '')
  const [actionState, setActionState] = useState<ListActionState>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const competitionOptions = useMemo(() => {
    const map = new Map<string, string>()
    matches.forEach((match) => {
      if (match.competitionSeasonId) {
        const label = `${match.competitionName}${match.competitionSeason ? ` • ${match.competitionSeason}` : ''}`
        map.set(match.competitionSeasonId, label)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [matches])

  const handleTransitionAction = useCallback(
    async (match: MatchSummary, action: MatchTransitionAction) => {
      setActionError(null)
      const id = String(match.id)
      setActionState({ matchId: id, action })
      try {
        if (action === 'start') {
          await MatchesGateway.start(id)
        } else if (action === 'pause') {
          await MatchesGateway.pause(id)
        } else if (action === 'resume') {
          await MatchesGateway.resume(id)
        } else if (action === 'startNextPeriod') {
          await MatchesGateway.startSecondHalf(id)
        }
      } catch (err) {
        console.error(`Failed to execute ${action} for match ${id}`, err)
        setActionError(resolveMatchActionError(err, actionFallbackMessages[action]))
      } finally {
        await refetch()
        setActionState(null)
      }
    },
    [refetch]
  )

  const handleOpenEvents = useCallback(
    (match: MatchSummary) => {
      router.push(`${MATCH_CONTROL_BASE_PATH}/${match.id}/control`)
    },
    [router]
  )

  const handleOpenRoster = useCallback(
    (match: MatchSummary) => {
      router.push(`/matches/${match.id}/roster`)
    },
    [router]
  )

  const handleOpenScoresheet = useCallback(
    (match: MatchSummary) => {
      setActionError(null)
      router.push(`/matches/${match.id}/scoresheet/preview`)
    },
    [router]
  )

  const handleEditMatch = useCallback(
    (match: MatchSummary) => {
      router.push(`/matches/${match.id}/edit`)
    },
    [router]
  )

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch}>
      <PageWrapper
        title="Gestão de partidas"
        description="Controle o fluxo completo das partidas de handebol: agendamento, tempo real e finalização."
        actions={<Button onClick={() => router.push('/matches/create')}>Nova partida</Button>}
      >
        <div className="space-y-4">
          {error && <AlertBanner variant="warning" message={error} />}
          {actionError && <AlertBanner variant="error" message={actionError} />}
        </div>

        <MatchesFilters
          searchValue={searchValue}
          competitionValue={filters.competitionSeasonId ?? 'all'}
          statusValue={filters.status ?? 'all'}
          dateValue={filters.date}
          competitionOptions={competitionOptions}
          lastSync={lastSync}
          onSearchChange={(value) => {
            setSearchValue(value)
            setSearchFilter(value)
          }}
          onCompetitionChange={(value) => setCompetitionFilter(value)}
          onStatusChange={(value) => setStatusFilter(value)}
          onDateChange={(value) => setDateFilter(value)}
        />

        <MatchesTable
          matches={matches}
          loading={loading}
          onTransitionAction={handleTransitionAction}
          onOpenRoster={handleOpenRoster}
          onOpenEvents={handleOpenEvents}
          onOpenScoresheet={handleOpenScoresheet}
          onEdit={handleEditMatch}
          actionState={actionState}
        />

        <PaginationControls
          meta={meta}
          isLoading={loading}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      </PageWrapper>
    </DashboardShell>
  )
}
