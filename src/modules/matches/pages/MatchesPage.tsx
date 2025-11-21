'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { MatchesFilters } from '../components/MatchesFilters'
import { MatchesTable } from '../components/MatchesTable'
import { PaginationControls } from '@/components/PaginationControls'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { useMatches } from '../hooks/useMatches'
import { MatchesGateway } from '../services/matches.service'
import type { MatchSummary } from '../types'
import { resolveMatchActionError } from '../utils/errors'

const MATCH_CONTROL_BASE_PATH = (process.env.NEXT_PUBLIC_MATCH_CONTROL_BASE_PATH ?? '/matches').replace(/\/$/, '')

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
  const [actionMatchId, setActionMatchId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const competitionOptions = useMemo(() => {
    const map = new Map<string, string>()
    matches.forEach((match) => {
      if (match.competitionId) {
        map.set(match.competitionId, match.competitionName)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [matches])

  const handleStartMatch = useCallback(
    async (match: MatchSummary) => {
      setActionError(null)
      const id = String(match.id)
      setActionMatchId(id)
      try {
        await MatchesGateway.start(id)
        refetch()
        router.push(`${MATCH_CONTROL_BASE_PATH}/${id}/control`)
      } catch (err) {
        console.error('Failed to start match', err)
        setActionError(resolveMatchActionError(err, 'Não foi possível iniciar a partida. Verifique o status e tente novamente.'))
        refetch()
      } finally {
        setActionMatchId(null)
      }
    },
    [refetch, router]
  )

  const handleEditMatch = useCallback(
    (match: MatchSummary) => {
      router.push(`/matches/${match.id}/edit`)
    },
    [router],
  )

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch}>
      <PageWrapper
        title="Gestão de partidas"
        description="Controle o fluxo completo das partidas de handebol: agendamento, tempo real e finalização."
        actions={
          <Button onClick={() => router.push('/matches/create')}>
            Nova partida
          </Button>
        }
      >
        <div className="space-y-4">
          {error && <AlertBanner variant="warning" message={error} />}
          {actionError && <AlertBanner variant="error" message={actionError} />}
        </div>

        <MatchesFilters
          searchValue={searchValue}
          competitionValue={filters.competitionId ?? 'all'}
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
          onStart={handleStartMatch}
          onEdit={handleEditMatch}
          actionMatchId={actionMatchId}
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
