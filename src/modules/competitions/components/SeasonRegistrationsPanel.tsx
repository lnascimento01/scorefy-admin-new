'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckSquare,
  ClipboardList,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils/cn'
import { useSeasonRegistrations } from '../hooks/useSeasonRegistrations'
import type {
  CompetitionSeason,
  CompetitionSeasonRegistrationPlayerSummary,
  CompetitionSeasonTeamPlayerRegistration,
  CompetitionSeasonTeamRegistration,
  RegistrationEligibilityStatus,
  RegistrationWorkflowStatus,
} from '../types'

const workflowOptions: Array<{ value: RegistrationWorkflowStatus; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'submitted', label: 'Enviada' },
  { value: 'under_review', label: 'Em revisão' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'rejected', label: 'Rejeitada' },
  { value: 'withdrawn', label: 'Retirada' },
]

const eligibilityOptions: Array<{ value: RegistrationEligibilityStatus; label: string }> = [
  { value: 'pending', label: 'Pendente' },
  { value: 'eligible', label: 'Elegível' },
  { value: 'ineligible', label: 'Inelegível' },
  { value: 'suspended', label: 'Suspenso' },
  { value: 'blocked_by_transfer', label: 'Bloqueado por transferência' },
]

type PlayerDraft = {
  registrationStatus: RegistrationWorkflowStatus
  eligibilityStatus: RegistrationEligibilityStatus
  shirtNumber: string
  position: string
  isCaptain: boolean
}

type BatchPlayerDefaults = {
  registrationStatus: RegistrationWorkflowStatus
  eligibilityStatus: RegistrationEligibilityStatus
}

type CompetitionContext = {
  name: string
  scope?: string
  country?: string
}

type WorkspaceTab = 'summary' | 'athletes' | 'administrative'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 'approved':
    case 'eligible':
      return 'success'
    case 'submitted':
    case 'under_review':
    case 'pending':
      return 'warning'
    case 'suspended':
      return 'info'
    case 'rejected':
    case 'withdrawn':
    case 'ineligible':
    case 'blocked_by_transfer':
      return 'danger'
    default:
      return 'default'
  }
}

function labelForStatus(status: string) {
  return workflowOptions.find((item) => item.value === status)?.label
    ?? eligibilityOptions.find((item) => item.value === status)?.label
    ?? status
}

function alertLabel(code: string) {
  switch (code) {
    case 'minimum_roster_not_met':
      return 'Elenco abaixo do mínimo'
    case 'maximum_roster_exceeded':
      return 'Elenco acima do máximo'
    case 'players_pending_review':
      return 'Jogadores pendentes'
    case 'players_with_eligibility_issues':
      return 'Elegibilidade pendente'
    case 'team_registration_not_approved':
      return 'Time não aprovado'
    default:
      return code
  }
}

function buildPlayerDraft(player: CompetitionSeasonTeamPlayerRegistration): PlayerDraft {
  return {
    registrationStatus: player.registrationStatus,
    eligibilityStatus: player.eligibilityStatus,
    shirtNumber: player.shirtNumber !== undefined && player.shirtNumber !== null ? String(player.shirtNumber) : '',
    position: player.position ?? '',
    isCaptain: player.isCaptain,
  }
}

function normalizeSearch(text?: string | null) {
  return (text ?? '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function matchesQuery(values: Array<string | undefined>, query: string) {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return true

  return normalizeSearch(values.filter(Boolean).join(' ')).includes(normalizedQuery)
}

function synthesizePlayerSummary(player: CompetitionSeasonTeamPlayerRegistration): CompetitionSeasonRegistrationPlayerSummary {
  return {
    id: player.playerId,
    fullName: player.player?.fullName ?? `Atleta #${player.playerId}`,
    nickname: player.player?.nickname,
    number: player.player?.number,
    positionName: player.player?.positionName ?? player.position ?? undefined,
    isActive: player.isActive,
  }
}

function uniqueLocationOptions(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
}

export function SeasonRegistrationsPanel({
  season,
  competitionContext,
}: {
  season: CompetitionSeason
  competitionContext?: CompetitionContext
}) {
  const registrations = useSeasonRegistrations(season.id)
  const {
    registrations: teamRegistrations,
    selectedRegistration,
    selectedRegistrationId,
    teamOptions,
    loading,
    saving,
    searchingTeams,
    error,
    success,
    selectRegistration,
    searchTeams,
    createTeamRegistration,
    deleteTeamRegistration,
  } = registrations

  const [teamSearchQuery, setTeamSearchQuery] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [teamListFilter, setTeamListFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [workspace, setWorkspace] = useState<{
    open: boolean
    registrationId: string | null
    tab: WorkspaceTab
  }>({
    open: false,
    registrationId: null,
    tab: 'summary',
  })

  useEffect(() => {
    searchTeams('').catch(() => undefined)
  }, [searchTeams])

  const summary = useMemo(() => ({
    teams: teamRegistrations.length,
    approvedTeams: teamRegistrations.filter((item) => item.registrationStatus === 'approved').length,
    activePlayers: teamRegistrations.reduce((acc, item) => acc + item.activePlayersCount, 0),
    issues: teamRegistrations.reduce((acc, item) => acc + item.pendingAlerts.length, 0),
  }), [teamRegistrations])

  const alreadyRegisteredTeamIds = useMemo(
    () => new Set(teamRegistrations.map((item) => item.teamId)),
    [teamRegistrations],
  )

  const availableTeamOptions = useMemo(
    () => teamOptions.filter((team) => !alreadyRegisteredTeamIds.has(team.id)),
    [alreadyRegisteredTeamIds, teamOptions],
  )

  const suggestedCountry = competitionContext?.country?.trim() ?? ''

  const countryOptions = useMemo(
    () => uniqueLocationOptions(availableTeamOptions.map((team) => team.country)),
    [availableTeamOptions],
  )
  const stateOptions = useMemo(
    () => uniqueLocationOptions(
      availableTeamOptions
        .filter((team) => !countryFilter || team.country === countryFilter)
        .map((team) => team.state),
    ),
    [availableTeamOptions, countryFilter],
  )
  const cityOptions = useMemo(
    () => uniqueLocationOptions(
      availableTeamOptions
        .filter((team) => !countryFilter || team.country === countryFilter)
        .filter((team) => !stateFilter || team.state === stateFilter)
        .map((team) => team.city),
    ),
    [availableTeamOptions, countryFilter, stateFilter],
  )

  const filteredCandidateTeams = useMemo(() => {
    const items = availableTeamOptions
      .filter((team) => !countryFilter || team.country === countryFilter)
      .filter((team) => !stateFilter || team.state === stateFilter)
      .filter((team) => !cityFilter || team.city === cityFilter)

    return [...items].sort((left, right) => {
      const leftScore = suggestedCountry && left.country === suggestedCountry ? 1 : 0
      const rightScore = suggestedCountry && right.country === suggestedCountry ? 1 : 0

      if (leftScore !== rightScore) return rightScore - leftScore
      return left.name.localeCompare(right.name, 'pt-BR')
    })
  }, [availableTeamOptions, cityFilter, countryFilter, stateFilter, suggestedCountry])

  const filteredRegistrations = useMemo(
    () => teamRegistrations.filter((registration) => matchesQuery([
      registration.team?.name,
      registration.team?.shortName,
      registration.team?.city,
      labelForStatus(registration.registrationStatus),
      labelForStatus(registration.eligibilityStatus),
    ], teamListFilter)),
    [teamListFilter, teamRegistrations],
  )

  const workspaceSummaryRegistration = useMemo(
    () => workspace.registrationId
      ? teamRegistrations.find((item) => item.id === workspace.registrationId) ?? null
      : null,
    [teamRegistrations, workspace.registrationId],
  )

  const workspaceDetailedRegistration = useMemo(
    () => (
      workspace.registrationId
      && selectedRegistrationId === workspace.registrationId
      && selectedRegistration?.id === workspace.registrationId
    )
      ? selectedRegistration
      : null,
    [selectedRegistration, selectedRegistrationId, workspace.registrationId],
  )

  const rules = season.registrationSettings ?? null

  const openWorkspace = (registrationId: string, tab: WorkspaceTab) => {
    selectRegistration(registrationId)
    setWorkspace({
      open: true,
      registrationId,
      tab,
    })
  }

  const closeWorkspace = () => {
    setWorkspace({
      open: false,
      registrationId: null,
      tab: 'summary',
    })
  }

  const handleCreateTeamRegistration = async () => {
    if (!selectedTeamId) return

    const created = await createTeamRegistration({
      teamId: selectedTeamId,
      registrationStatus: 'draft',
      eligibilityStatus: 'pending',
    })

    if (created) {
      setSelectedTeamId('')
      setTeamSearchQuery('')
      setCountryFilter('')
      setStateFilter('')
      setCityFilter('')
      openWorkspace(created.id, 'athletes')
    }
  }

  return (
    <div className="space-y-4">
      {(error || success) && (
        <AlertBanner
          variant={error ? 'error' : 'success'}
          message={error ?? undefined}
          title={success ?? undefined}
        />
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Inscrições da temporada</p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-textPrimary">{season.label ?? season.name}</h3>
            <Badge variant="info">{season.status}</Badge>
            <Badge variant={rules?.enabled === false ? 'warning' : 'success'}>
              {rules?.enabled === false ? 'Inscrição fechada' : 'Inscrição habilitada'}
            </Badge>
          </div>
          <p className="truncate text-sm text-textSecondary">
            {season.season} • tela principal focada em localizar, inscrever e abrir times inscritos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <InlineStat label="Times" value={summary.teams} icon={<Users className="h-3.5 w-3.5" />} />
          <InlineStat label="Aprovados" value={summary.approvedTeams} icon={<BadgeCheck className="h-3.5 w-3.5" />} />
          <InlineStat label="Atletas" value={summary.activePlayers} icon={<UserPlus className="h-3.5 w-3.5" />} />
          <InlineStat label="Pendências" value={summary.issues} icon={<ShieldAlert className="h-3.5 w-3.5" />} />
        </div>
      </div>

      {rules && !rules.enabled && (
        <AlertBanner
          variant="warning"
          title="Inscrições desabilitadas"
          message="A temporada está configurada com inscrições fechadas. A visualização continua disponível, mas novas mudanças podem ser recusadas pela API."
        />
      )}

      <div className="rounded-2xl border border-borderSofter bg-surface-elevated p-4">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-textPrimary">Inscrever novo time</p>
            <p className="text-xs text-textSecondary">Busca rápida com refinamento local opcional e sem bloquear times válidos.</p>
          </div>
          {suggestedCountry && (
            <div className="flex items-center gap-2 rounded-lg border border-borderSoft bg-surface-muted px-3 py-1.5 text-[11px] text-textSecondary">
              <MapPin className="h-3.5 w-3.5" />
              Priorizando visualmente times de {suggestedCountry}
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={teamSearchQuery}
                onChange={(event) => setTeamSearchQuery(event.target.value)}
                placeholder="Buscar time"
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={searchingTeams}
                onClick={() => searchTeams(teamSearchQuery).catch(() => undefined)}
              >
                {searchingTeams ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
                <option value="">País</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </Select>
              <Select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
                <option value="">Estado</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </Select>
              <Select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
                <option value="">Cidade</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-textSecondary">
              <span>{filteredCandidateTeams.length} times disponíveis</span>
              <span>{selectedTeamId ? '1 selecionado' : 'nenhum selecionado'}</span>
            </div>

            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-surface-contrast p-2">
              {filteredCandidateTeams.length === 0 ? (
                <div className="px-2 py-4 text-sm text-textSecondary">Nenhum time disponível para os filtros atuais.</div>
              ) : (
                filteredCandidateTeams.map((team) => {
                  const active = selectedTeamId === team.id

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-left transition',
                        active
                          ? 'border-[color:var(--brand-soft-border)] bg-[var(--brand-soft)]'
                          : 'border-transparent bg-surface-contrast hover:border-[color:var(--brand-soft-border)] hover:bg-surface-elevated',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-textPrimary">{team.name}</p>
                          <p className="truncate text-xs text-textSecondary">
                            {[team.shortName, team.city, team.state, team.country].filter(Boolean).join(' • ') || 'Sem localização detalhada'}
                          </p>
                        </div>
                        {active && <Badge variant="success">Selecionado</Badge>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <Button type="button" className="w-full gap-2" disabled={!selectedTeamId || saving} onClick={() => handleCreateTeamRegistration().catch(() => undefined)}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Inscrever time
            </Button>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-textPrimary">Times inscritos</p>
            <p className="text-xs text-textSecondary">Tabela operacional para localizar o time, abrir o workspace e executar ações rápidas.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={teamListFilter}
              onChange={(event) => setTeamListFilter(event.target.value)}
              placeholder="Filtrar times inscritos"
              className="w-full lg:w-72"
            />
            <Badge variant="info">{filteredRegistrations.length}</Badge>
          </div>
        </div>

        <Table className="min-w-[1240px] text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[24%]">Time</TableHead>
              <TableHead className="w-[8%]">Sigla</TableHead>
              <TableHead className="w-[12%]">Workflow</TableHead>
              <TableHead className="w-[12%]">Elegibilidade</TableHead>
              <TableHead className="w-[7%] text-center">Ativos</TableHead>
              <TableHead className="w-[8%] text-center">Pendentes</TableHead>
              <TableHead className="w-[10%] text-center">Bloqueados</TableHead>
              <TableHead className="w-[12%]">Alertas</TableHead>
              <TableHead className="w-[17%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-6 text-textSecondary">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando inscrições...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-6 text-textSecondary">
                  {teamRegistrations.length === 0 ? 'Nenhum time inscrito nesta temporada.' : 'Nenhum time corresponde ao filtro atual.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((registration) => {
                const active = workspace.open && workspace.registrationId === registration.id

                return (
                  <TableRow key={registration.id} className={active ? 'bg-[var(--brand-soft)]' : ''}>
                    <TableCell>
                      <button type="button" className="min-w-0 text-left" onClick={() => openWorkspace(registration.id, 'summary')}>
                        <p className={cn('truncate font-medium', active ? 'text-primary' : 'text-textPrimary')}>
                          {registration.team?.name ?? `Time #${registration.teamId}`}
                        </p>
                        <p className="truncate text-xs text-textSecondary">{registration.team?.city ?? 'Sem cidade informada'}</p>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-textSecondary">{registration.team?.shortName ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(registration.registrationStatus)}>{labelForStatus(registration.registrationStatus)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(registration.eligibilityStatus)}>{labelForStatus(registration.eligibilityStatus)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{registration.activePlayersCount}</TableCell>
                    <TableCell className="text-center">{registration.pendingPlayersCount}</TableCell>
                    <TableCell className="text-center">{registration.ineligiblePlayersCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {registration.pendingAlerts.length === 0 ? (
                          <span className="text-xs text-textSecondary">Sem alertas</span>
                        ) : (
                          registration.pendingAlerts.slice(0, 2).map((alert) => (
                            <Badge key={alert} variant="warning">{alertLabel(alert)}</Badge>
                          ))
                        )}
                        {registration.pendingAlerts.length > 2 && (
                          <Badge variant="default">+{registration.pendingAlerts.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                        <Button type="button" size="sm" variant="ghost" onClick={() => openWorkspace(registration.id, 'summary')}>
                          Abrir
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => openWorkspace(registration.id, 'athletes')}>
                          Atletas
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => openWorkspace(registration.id, 'administrative')}>
                          Administrativo
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-danger"
                          disabled={saving}
                          onClick={() => deleteTeamRegistration(registration.id).catch(() => undefined)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Retirar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TeamRegistrationWorkspaceModal
        open={workspace.open}
        onClose={closeWorkspace}
        activeTab={workspace.tab}
        onTabChange={(tab) => setWorkspace((current) => ({ ...current, tab }))}
        season={season}
        summaryRegistration={workspaceSummaryRegistration}
        detailedRegistration={workspaceDetailedRegistration}
        loadingDetail={Boolean(workspace.registrationId && workspace.registrationId !== selectedRegistration?.id)}
        registrations={registrations}
        saving={saving}
      />
    </div>
  )
}

function SummaryPill({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-xl border border-borderSoft bg-surface-contrast px-3 py-2">
      <div className="flex items-center gap-2 text-textSecondary">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-textPrimary">{value}</p>
    </div>
  )
}

function InlineStat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-borderSofter bg-surface-contrast px-3 py-1.5 text-sm">
      <span className="text-textSecondary">{icon}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-textSecondary">{label}</span>
      <span className="font-semibold text-textPrimary">{value}</span>
    </div>
  )
}

function TeamRegistrationWorkspaceModal({
  open,
  onClose,
  activeTab,
  onTabChange,
  season,
  summaryRegistration,
  detailedRegistration,
  loadingDetail,
  registrations,
  saving,
}: {
  open: boolean
  onClose: () => void
  activeTab: WorkspaceTab
  onTabChange: (tab: WorkspaceTab) => void
  season: CompetitionSeason
  summaryRegistration: CompetitionSeasonTeamRegistration | null
  detailedRegistration: CompetitionSeasonTeamRegistration | null
  loadingDetail: boolean
  registrations: ReturnType<typeof useSeasonRegistrations>
  saving: boolean
}) {
  if (!open || !summaryRegistration) return null

  const headerRegistration = detailedRegistration ?? summaryRegistration

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,12,0.86)] p-4 backdrop-blur-md lg:p-6">
      <div className="flex h-[84vh] w-[min(88vw,1480px)] flex-col overflow-hidden rounded-[28px] border border-borderSoft bg-surface-contrast shadow-popover">
        <div className="flex items-start justify-between gap-4 border-b border-borderSofter px-6 py-4">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-textMuted">Workspace do time inscrito</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="truncate text-xl font-semibold text-textPrimary">
                {headerRegistration.team?.name ?? `Time #${headerRegistration.teamId}`}
              </h3>
              <Badge variant={statusVariant(headerRegistration.registrationStatus)}>{labelForStatus(headerRegistration.registrationStatus)}</Badge>
              <Badge variant={statusVariant(headerRegistration.eligibilityStatus)}>{labelForStatus(headerRegistration.eligibilityStatus)}</Badge>
            </div>
            <p className="text-xs text-textSecondary">
              {season.label ?? season.name} • {season.season}
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-4">
          <Tabs
            options={[
              { value: 'summary', label: 'Resumo' },
              { value: 'athletes', label: 'Atletas' },
              { value: 'administrative', label: 'Administrativo' },
            ]}
            value={activeTab}
            onChange={(value) => onTabChange(value as WorkspaceTab)}
            variant="workspace"
            className="max-w-3xl"
          />

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-2 pr-2">
            {activeTab === 'summary' && (
              <SummaryTab registration={headerRegistration} />
            )}

            {activeTab === 'athletes' && (
              detailedRegistration ? (
                <AthletesTab
                  key={detailedRegistration.id}
                  registration={detailedRegistration}
                  registrations={registrations}
                  saving={saving}
                />
              ) : (
                <WorkspaceLoader loadingDetail={loadingDetail} label="Carregando elenco inscrito..." />
              )
            )}

            {activeTab === 'administrative' && (
              detailedRegistration ? (
                <AdministrativeTab
                  key={detailedRegistration.id}
                  registration={detailedRegistration}
                  updateTeamRegistration={registrations.updateTeamRegistration}
                  saving={saving}
                />
              ) : (
                <WorkspaceLoader loadingDetail={loadingDetail} label="Carregando dados administrativos..." />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceLoader({ loadingDetail, label }: { loadingDetail: boolean; label: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-borderSoft bg-surface-muted">
      <div className="flex items-center gap-3 text-textSecondary">
        {loadingDetail ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
        <span>{label}</span>
      </div>
    </div>
  )
}

function SummaryTab({ registration }: { registration: CompetitionSeasonTeamRegistration }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryPill label="Ativos" value={registration.activePlayersCount} icon={<Users className="h-4 w-4" />} />
        <SummaryPill label="Pendentes" value={registration.pendingPlayersCount} icon={<ShieldAlert className="h-4 w-4" />} />
        <SummaryPill label="Bloqueados" value={registration.ineligiblePlayersCount} icon={<AlertTriangle className="h-4 w-4" />} />
        <SummaryPill label="Total" value={registration.playersCount} icon={<BadgeCheck className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="rounded-2xl bg-surface-elevated p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-textPrimary">Contexto da inscrição</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(registration.registrationStatus)}>{labelForStatus(registration.registrationStatus)}</Badge>
              <Badge variant={statusVariant(registration.eligibilityStatus)}>{labelForStatus(registration.eligibilityStatus)}</Badge>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-textSecondary md:grid-cols-2">
            <p>Time: <span className="font-medium text-textPrimary">{registration.team?.name ?? `Time #${registration.teamId}`}</span></p>
            <p>Sigla: <span className="font-medium text-textPrimary">{registration.team?.shortName ?? '—'}</span></p>
            <p>Cidade: <span className="font-medium text-textPrimary">{registration.team?.city ?? '—'}</span></p>
            <p>Total inscrito: <span className="font-medium text-textPrimary">{registration.playersCount}</span></p>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-elevated p-4">
          <p className="text-sm font-semibold text-textPrimary">Alertas e pendências</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {registration.pendingAlerts.length === 0 ? (
              <span className="text-sm text-textSecondary">Nenhum alerta operacional.</span>
            ) : (
              registration.pendingAlerts.map((alert) => (
                <Badge key={alert} variant="warning">{alertLabel(alert)}</Badge>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AthletesTab({
  registration,
  registrations,
  saving,
}: {
  registration: CompetitionSeasonTeamRegistration
  registrations: ReturnType<typeof useSeasonRegistrations>
  saving: boolean
}) {
  const [availableFilter, setAvailableFilter] = useState('')
  const [registeredFilter, setRegisteredFilter] = useState('')
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([])
  const [selectedRegisteredIds, setSelectedRegisteredIds] = useState<string[]>([])
  const [workingRegisteredPlayerIds, setWorkingRegisteredPlayerIds] = useState<string[]>(
    () => (registration.players ?? []).filter((player) => player.isActive).map((player) => player.playerId),
  )
  const [batchDefaults, setBatchDefaults] = useState<BatchPlayerDefaults>({
    registrationStatus: 'draft',
    eligibilityStatus: 'pending',
  })
  const [playerDrafts, setPlayerDrafts] = useState<Record<string, PlayerDraft>>(
    Object.fromEntries((registration.players ?? []).map((player) => [player.id, buildPlayerDraft(player)])),
  )
  const {
    playerOptions,
    reconcilePlayerRegistrations,
    searchPlayers,
    searchingPlayers,
    updatePlayerRegistration,
  } = registrations

  useEffect(() => {
    if (!registration.teamId) return
    searchPlayers(registration.teamId, '').catch(() => undefined)
  }, [registration.teamId, searchPlayers])

  const sortedPlayers = useMemo(() => {
    const items = [...(registration.players ?? [])]
    items.sort((left, right) => {
      if (left.isActive !== right.isActive) return left.isActive ? -1 : 1
      return (left.player?.fullName ?? '').localeCompare(right.player?.fullName ?? '', 'pt-BR')
    })
    return items
  }, [registration.players])

  const activePlayers = useMemo(
    () => sortedPlayers.filter((player) => player.isActive),
    [sortedPlayers],
  )

  const teamBasePlayers = useMemo(() => {
    const map = new Map<string, CompetitionSeasonRegistrationPlayerSummary>()
    playerOptions.forEach((player) => map.set(player.id, player))
    sortedPlayers.forEach((player) => {
      if (!map.has(player.playerId)) {
        map.set(player.playerId, synthesizePlayerSummary(player))
      }
    })
    return [...map.values()].sort((left, right) => left.fullName.localeCompare(right.fullName, 'pt-BR'))
  }, [playerOptions, sortedPlayers])

  const workingSet = useMemo(
    () => new Set(workingRegisteredPlayerIds),
    [workingRegisteredPlayerIds],
  )

  const availablePlayers = useMemo(
    () => teamBasePlayers.filter((player) => !workingSet.has(player.id)).filter((player) => matchesQuery([
      player.fullName,
      player.nickname,
      player.positionName,
      player.number !== undefined ? String(player.number) : undefined,
    ], availableFilter)),
    [availableFilter, teamBasePlayers, workingSet],
  )

  const registeredPlayers = useMemo(
    () => teamBasePlayers.filter((player) => workingSet.has(player.id)).filter((player) => matchesQuery([
      player.fullName,
      player.nickname,
      player.positionName,
      player.number !== undefined ? String(player.number) : undefined,
    ], registeredFilter)),
    [registeredFilter, teamBasePlayers, workingSet],
  )

  const moveToRegistered = () => {
    if (!selectedAvailableIds.length) return
    setWorkingRegisteredPlayerIds((current) => [...new Set([...current, ...selectedAvailableIds])])
    setSelectedAvailableIds([])
  }

  const moveToAvailable = () => {
    if (!selectedRegisteredIds.length) return
    setWorkingRegisteredPlayerIds((current) => current.filter((playerId) => !selectedRegisteredIds.includes(playerId)))
    setSelectedRegisteredIds([])
  }

  const handleConfirmRosterChanges = async () => {
    const initialActiveIds = new Set(activePlayers.map((player) => player.playerId))
    const targetActiveIds = new Set(workingRegisteredPlayerIds)

    const add = teamBasePlayers
      .filter((player) => targetActiveIds.has(player.id) && !initialActiveIds.has(player.id))
      .map((player) => ({
        playerId: player.id,
        registrationStatus: batchDefaults.registrationStatus,
        eligibilityStatus: batchDefaults.eligibilityStatus,
      }))

    const remove = activePlayers
      .filter((player) => !targetActiveIds.has(player.playerId))
      .map((player) => player.id)

    const result = await reconcilePlayerRegistrations(registration.id, { add, remove })
    if (result.added > 0 || result.removed > 0) {
      setSelectedAvailableIds([])
      setSelectedRegisteredIds([])
    }
  }

  const handlePlayerDraftChange = (playerId: string, patch: Partial<PlayerDraft>) => {
    setPlayerDrafts((current) => ({
      ...current,
      [playerId]: {
        ...(current[playerId] ?? buildPlayerDraft(sortedPlayers.find((player) => player.id === playerId) ?? {
          id: playerId,
          competitionSeasonTeamRegistrationId: registration.id,
          playerId,
          registrationStatus: 'draft',
          eligibilityStatus: 'pending',
          shirtNumber: null,
          position: null,
          isCaptain: false,
          meta: {},
          isActive: true,
        } as CompetitionSeasonTeamPlayerRegistration)),
        ...patch,
      },
    }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-surface-elevated p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{workingRegisteredPlayerIds.length} inscritos no rascunho</Badge>
            <Badge variant="default">{selectedAvailableIds.length} para entrar</Badge>
            <Badge variant="default">{selectedRegisteredIds.length} para sair</Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[340px]">
            <Select
              value={batchDefaults.registrationStatus}
              onChange={(event) => setBatchDefaults((current) => ({ ...current, registrationStatus: event.target.value as RegistrationWorkflowStatus }))}
            >
              {workflowOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
            <Select
              value={batchDefaults.eligibilityStatus}
              onChange={(event) => setBatchDefaults((current) => ({ ...current, eligibilityStatus: event.target.value as RegistrationEligibilityStatus }))}
            >
              {eligibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 grid min-h-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_116px_minmax(0,1fr)]">
          <TransferList
            title="Disponíveis"
            helper="Atletas do time base"
            filterValue={availableFilter}
            onFilterChange={setAvailableFilter}
            loading={searchingPlayers}
            players={availablePlayers}
            selectedIds={selectedAvailableIds}
            onToggle={(playerId) => setSelectedAvailableIds((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId])}
          />

          <div className="sticky top-3 z-10 flex self-start xl:top-4">
            <div className="flex w-full min-w-[116px] flex-row gap-2 rounded-2xl border border-borderSofter bg-[color:color-mix(in_srgb,var(--surface-contrast)_92%,transparent)] p-2 shadow-card backdrop-blur-sm xl:flex-col">
              <Button
                type="button"
                variant="primary"
                className="w-full gap-2"
                onClick={moveToRegistered}
                disabled={selectedAvailableIds.length === 0}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="hidden xl:inline">Entrar</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={moveToAvailable}
                disabled={selectedRegisteredIds.length === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden xl:inline">Sair</span>
              </Button>
            </div>
          </div>

          <TransferList
            title="Inscritos"
            helper="Rascunho atual da temporada"
            filterValue={registeredFilter}
            onFilterChange={setRegisteredFilter}
            loading={false}
            players={registeredPlayers}
            selectedIds={selectedRegisteredIds}
            onToggle={(playerId) => setSelectedRegisteredIds((current) => current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId])}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-surface-contrast px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-textSecondary">
            Confirme as mudanças de elenco e ajuste camisa, posição e capitão na tabela logo abaixo.
          </p>
          <Button type="button" className="gap-2" disabled={saving} onClick={() => handleConfirmRosterChanges().catch(() => undefined)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
            Confirmar mudanças
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-textPrimary">Elenco inscrito</p>
          <p className="text-xs text-textSecondary">Tabela compacta para ajuste fino dos atletas já inscritos.</p>
        </div>

        {sortedPlayers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-borderSoft px-4 py-6 text-sm text-textSecondary">
            Este time ainda não possui atletas inscritos na temporada.
          </div>
        ) : (
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Elegibilidade</TableHead>
                <TableHead>Camisa</TableHead>
                <TableHead>Posição</TableHead>
                <TableHead>Capitão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const draft = playerDrafts[player.id] ?? buildPlayerDraft(player)

                return (
                  <TableRow key={player.id} className={!player.isActive ? 'opacity-65' : ''}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-textPrimary">{player.player?.fullName ?? `Atleta #${player.playerId}`}</p>
                          <Badge variant={player.isActive ? 'success' : 'default'}>
                            {player.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-textSecondary">
                          {player.player?.nickname ? `${player.player.nickname} • ` : ''}{player.player?.positionName ?? 'Posição não informada'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft.registrationStatus}
                        onChange={(event) => handlePlayerDraftChange(player.id, { registrationStatus: event.target.value as RegistrationWorkflowStatus })}
                      >
                        {workflowOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={draft.eligibilityStatus}
                        onChange={(event) => handlePlayerDraftChange(player.id, { eligibilityStatus: event.target.value as RegistrationEligibilityStatus })}
                      >
                        {eligibilityOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input value={draft.shirtNumber} onChange={(event) => handlePlayerDraftChange(player.id, { shirtNumber: event.target.value })} placeholder="Nº" />
                    </TableCell>
                    <TableCell>
                      <Input value={draft.position} onChange={(event) => handlePlayerDraftChange(player.id, { position: event.target.value })} placeholder="Posição" />
                    </TableCell>
                    <TableCell>
                      <label className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={draft.isCaptain}
                          onChange={(event) => handlePlayerDraftChange(player.id, { isCaptain: event.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                      </label>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => updatePlayerRegistration(player.id, {
                            registrationStatus: draft.registrationStatus,
                            eligibilityStatus: draft.eligibilityStatus,
                            shirtNumber: draft.shirtNumber.trim() ? Number(draft.shirtNumber) : null,
                            position: draft.position.trim() || null,
                            isCaptain: draft.isCaptain,
                          }).catch(() => undefined)}
                        >
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          disabled={saving}
                          onClick={() => registrations.deletePlayerRegistration(player.id).catch(() => undefined)}
                        >
                          Retirar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function AdministrativeTab({
  registration,
  updateTeamRegistration,
  saving,
}: {
  registration: CompetitionSeasonTeamRegistration
  updateTeamRegistration: ReturnType<typeof useSeasonRegistrations>['updateTeamRegistration']
  saving: boolean
}) {
  const [teamForm, setTeamForm] = useState({
    registrationStatus: registration.registrationStatus,
    eligibilityStatus: registration.eligibilityStatus,
    notes: registration.notes ?? '',
    rejectionReason: registration.rejectionReason ?? '',
  })

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
      <div className="rounded-2xl bg-surface-elevated p-4">
        <p className="text-sm font-semibold text-textPrimary">Administrativo da inscrição</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm md:col-span-1">
            <span className="text-textSecondary">Workflow</span>
            <Select
              value={teamForm.registrationStatus}
              onChange={(event) => setTeamForm((current) => ({ ...current, registrationStatus: event.target.value as RegistrationWorkflowStatus }))}
            >
              {workflowOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm md:col-span-1">
            <span className="text-textSecondary">Elegibilidade</span>
            <Select
              value={teamForm.eligibilityStatus}
              onChange={(event) => setTeamForm((current) => ({ ...current, eligibilityStatus: event.target.value as RegistrationEligibilityStatus }))}
            >
              {eligibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span className="text-textSecondary">Notas</span>
            <textarea
              value={teamForm.notes}
              onChange={(event) => setTeamForm((current) => ({ ...current, notes: event.target.value }))}
              className="field-area min-h-20"
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-2">
            <span className="text-textSecondary">Motivo de rejeição</span>
            <Input
              value={teamForm.rejectionReason}
              onChange={(event) => setTeamForm((current) => ({ ...current, rejectionReason: event.target.value }))}
            />
          </label>

          <div className="md:col-span-2">
            <Button
              type="button"
              disabled={saving}
              className="w-full gap-2 md:w-auto"
              onClick={() => updateTeamRegistration(registration.id, {
                registrationStatus: teamForm.registrationStatus,
                eligibilityStatus: teamForm.eligibilityStatus,
                notes: teamForm.notes.trim() || null,
                rejectionReason: teamForm.rejectionReason.trim() || null,
              }).catch(() => undefined)}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              Salvar administrativo
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-elevated p-4">
        <p className="text-sm font-semibold text-textPrimary">Linha do tempo</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <CompactDate label="Enviada em" value={registration.submittedAt} />
          <CompactDate label="Revisada em" value={registration.reviewedAt} />
          <CompactDate label="Aprovada em" value={registration.approvedAt} />
          <CompactDate label="Rejeitada em" value={registration.rejectedAt} />
          <CompactDate label="Retirada em" value={registration.withdrawnAt} />
          <CompactDate label="Bloqueada em" value={registration.lockedAt} />
        </div>
      </div>
    </div>
  )
}

function CompactDate({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl bg-surface-contrast px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-textSecondary">{label}</p>
      <p className="mt-1 text-sm font-medium text-textPrimary">{formatDateTime(value)}</p>
    </div>
  )
}

function TransferList({
  title,
  helper,
  filterValue,
  onFilterChange,
  loading,
  players,
  selectedIds,
  onToggle,
}: {
  title: string
  helper: string
  filterValue: string
  onFilterChange: (value: string) => void
  loading: boolean
  players: CompetitionSeasonRegistrationPlayerSummary[]
  selectedIds: string[]
  onToggle: (playerId: string) => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col rounded-2xl bg-surface-contrast">
      <div className="border-b border-borderSofter px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-textPrimary">{title}</p>
            <p className="text-xs text-textSecondary">{helper}</p>
          </div>
          <Badge variant="info">{players.length}</Badge>
        </div>
        <Input
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder={`Filtrar ${title.toLocaleLowerCase('pt-BR')}`}
          className="mt-3"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-elevated px-4 py-3 text-textSecondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando atletas...
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-borderSoft px-4 py-8 text-sm text-textSecondary">
            Nenhum atleta neste lado com o filtro atual.
          </div>
        ) : (
          <div className="space-y-1.5">
            {players.map((player) => {
              const active = selectedIds.includes(player.id)

              return (
                <label
                  key={player.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition',
                    active
                      ? 'border-[color:var(--brand-soft-border)] bg-[var(--brand-soft)]'
                      : 'border-borderSofter bg-surface-contrast hover:border-[color:var(--brand-soft-border)] hover:bg-surface-elevated',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(player.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-textPrimary">{player.fullName}</p>
                      {player.number !== undefined && <Badge variant="default">#{player.number}</Badge>}
                    </div>
                    <p className="truncate text-sm text-textSecondary">
                      {[player.nickname, player.positionName].filter(Boolean).join(' • ') || 'Sem dados adicionais'}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
