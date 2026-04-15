'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, BookOpen, CalendarRange, Loader2, Save, Settings2, ShieldCheck, Trash2, Users } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useCompetitionCatalogs } from '../hooks/useCompetitionCatalogs'
import { useCompetitionEditor } from '../hooks/useCompetitionEditor'
import { SeasonRegistrationsPanel } from '../components/SeasonRegistrationsPanel'
import type { CompetitionHandballRule, JsonValue } from '../types'

function formatJson(value: JsonValue) {
  return JSON.stringify(value, null, 2)
}

function parseJsonField(value: string, fieldLabel: string): JsonValue {
  const trimmed = value.trim()
  if (!trimmed) return {}

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error(`${fieldLabel} precisa ser um JSON válido.`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${fieldLabel} precisa ser um objeto ou array JSON.`)
  }

  return parsed as JsonValue
}

function toRulesForm(rule?: CompetitionHandballRule | null) {
  return {
    pointsForWin: rule?.pointsForWin !== undefined ? String(rule.pointsForWin) : '',
    pointsForDraw: rule?.pointsForDraw !== undefined ? String(rule.pointsForDraw) : '',
    pointsForLoss: rule?.pointsForLoss !== undefined ? String(rule.pointsForLoss) : '',
    pointsForOvertimeWin: rule?.pointsForOvertimeWin !== undefined ? String(rule.pointsForOvertimeWin) : '',
    pointsForOvertimeLoss: rule?.pointsForOvertimeLoss !== undefined ? String(rule.pointsForOvertimeLoss) : '',
    pointsForPenaltyWin: rule?.pointsForPenaltyWin !== undefined ? String(rule.pointsForPenaltyWin) : '',
    pointsForPenaltyLoss: rule?.pointsForPenaltyLoss !== undefined ? String(rule.pointsForPenaltyLoss) : '',
    allowDraws: rule?.allowDraws ?? false,
    tiebreakers: rule?.tiebreakers?.join(', ') ?? '',
  }
}

function parseRuleNumber(value: string, label: string) {
  if (value.trim() === '') {
    throw new Error(`${label} é obrigatório.`)
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10) {
    throw new Error(`${label} deve ser um inteiro entre 0 e 10.`)
  }
  return parsed
}

const ToastViewport = dynamic(async () => {
  const mod = await import('react-toastify')
  return { default: mod.ToastContainer }
}, { ssr: false })

type WorkspaceSection = 'general' | 'seasons' | 'registrations' | 'config' | 'rules'

const workspaceOptions: Array<{
  value: WorkspaceSection
  label: string
  helper: string
  icon: typeof BookOpen
}> = [
  { value: 'general', label: 'Geral', helper: 'Competição fixa', icon: BookOpen },
  { value: 'seasons', label: 'Temporadas', helper: 'Contexto sazonal', icon: CalendarRange },
  { value: 'registrations', label: 'Inscrições', helper: 'Times e atletas', icon: Users },
  { value: 'config', label: 'Configuração', helper: 'Overrides da temporada', icon: Settings2 },
  { value: 'rules', label: 'Regras', helper: 'Handebol da temporada', icon: ShieldCheck },
]

export function CompetitionEditPage({ currentUser, competitionId }: { currentUser: AuthProfile; competitionId: string }) {
  const router = useRouter()
  const catalogs = useCompetitionCatalogs()
  const editor = useCompetitionEditor(competitionId)
  const {
    competition,
    seasons,
    selectedSeason,
    selectedSeasonId,
    loading,
    savingCompetition,
    savingSeason,
    savingConfig,
    savingRules,
    removingCompetition,
    removingSeason,
    error,
    success,
    selectSeason,
    updateCompetition,
    createSeason,
    updateSeason,
    removeSeason,
    updateSeasonConfig,
    updateSeasonHandballRules,
    removeCompetition,
  } = editor

  const [localError, setLocalError] = useState<string | null>(null)
  const [confirmCompetitionOpen, setConfirmCompetitionOpen] = useState(false)
  const [confirmSeasonOpen, setConfirmSeasonOpen] = useState(false)
  const [seasonFormOpen, setSeasonFormOpen] = useState(false)
  const [workspaceSection, setWorkspaceSection] = useState<WorkspaceSection>('general')

  const [competitionForm, setCompetitionForm] = useState({
    name: '',
    typeId: '',
    locale: 'pt-BR',
    status: 'draft',
    countryId: '',
    scope: 'national',
    naipe: 'misto',
    category: '',
    meta: '',
  })

  const [seasonForm, setSeasonForm] = useState({
    name: '',
    label: '',
    season: '',
    status: 'draft',
    referenceYearStart: '',
    referenceYearEnd: '',
    startAt: '',
    endAt: '',
    meta: '',
  })

  const [configText, setConfigText] = useState('{}')
  const [rulesForm, setRulesForm] = useState(() => toRulesForm())

  const seasonOptions = useMemo(
    () =>
      seasons.map((season) => {
        const label = season.label || season.name || season.season || season.id
        const detail = season.season && season.season !== label ? season.season : ''
        return { id: season.id, label, detail }
      }),
    [seasons],
  )

  const selectedType = useMemo(
    () => catalogs.competitionTypes.find((type) => type.id === competitionForm.typeId) ?? null,
    [catalogs.competitionTypes, competitionForm.typeId],
  )

  const resolvedHandballRule = useMemo(() => selectedSeason?.handballRule ?? null, [selectedSeason])

  useEffect(() => {
    if (!competition) return
    setCompetitionForm({
      name: competition.name,
      typeId: competition.typeId,
      locale: competition.locale,
      status: competition.status,
      countryId: competition.countryId ?? '',
      scope: competition.scope,
      naipe: competition.naipe ?? 'misto',
      category: competition.category ?? '',
      meta: JSON.stringify(competition.meta ?? {}, null, 2),
    })
  }, [competition])

  useEffect(() => {
    if (!selectedSeason) return
    setSeasonForm({
      name: selectedSeason.name,
      label: selectedSeason.label ?? selectedSeason.name,
      season: selectedSeason.season,
      status: selectedSeason.status,
      referenceYearStart: selectedSeason.referenceYearStart ? String(selectedSeason.referenceYearStart) : '',
      referenceYearEnd: selectedSeason.referenceYearEnd ? String(selectedSeason.referenceYearEnd) : '',
      startAt: selectedSeason.startAt ?? '',
      endAt: selectedSeason.endAt ?? '',
      meta: JSON.stringify(selectedSeason.meta ?? {}, null, 2),
    })
    setConfigText(formatJson(selectedSeason.configOverrides))
    setRulesForm(toRulesForm(resolvedHandballRule))
  }, [selectedSeason, resolvedHandballRule])

  useEffect(() => {
    if (!seasons.length) return
    const hasSelected = selectedSeasonId ? seasons.some((season) => season.id === selectedSeasonId) : false
    if (!hasSelected && seasons.length === 1) {
      selectSeason(seasons[0].id)
    }
  }, [seasons, selectedSeasonId, selectSeason])

  const handleCompetitionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!competitionForm.name.trim()) {
      setLocalError('Nome é obrigatório.')
      return
    }
    if (!competitionForm.typeId) {
      setLocalError('Selecione um tipo de competição.')
      return
    }

    let meta: JsonValue
    try {
      meta = parseJsonField(competitionForm.meta, 'Meta')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível validar a competição.')
      return
    }

    const updated = await updateCompetition({
      name: competitionForm.name.trim(),
      typeId: competitionForm.typeId,
      locale: competitionForm.locale.trim() || 'pt-BR',
      status: competitionForm.status as 'draft' | 'published' | 'archived',
      countryId: competitionForm.countryId || null,
      scope: competitionForm.scope as 'national' | 'state' | 'international',
      naipe: competitionForm.naipe as 'masculino' | 'feminino' | 'misto',
      category: competitionForm.category.trim() || null,
      meta,
    })
    if (updated) {
      toast.success('Competição atualizada.')
    }
  }

  const handleCreateSeason = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!seasonForm.name.trim()) {
      setLocalError('Nome da temporada é obrigatório.')
      return
    }
    if (!seasonForm.label.trim()) {
      setLocalError('Label da temporada é obrigatório.')
      return
    }
    if (!seasonForm.season.trim()) {
      setLocalError('Campo temporada é obrigatório.')
      return
    }
    if (!seasonForm.referenceYearStart.trim()) {
      setLocalError('Ano de referência inicial é obrigatório.')
      return
    }

    let meta: JsonValue | undefined
    try {
      meta = seasonForm.meta.trim() ? parseJsonField(seasonForm.meta, 'Meta da temporada') : undefined
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível validar a temporada.')
      return
    }

    const referenceYearStart = Number(seasonForm.referenceYearStart)
    if (Number.isNaN(referenceYearStart)) {
      setLocalError('Ano de referência inicial inválido.')
      return
    }
    const referenceYearEnd = seasonForm.referenceYearEnd ? Number(seasonForm.referenceYearEnd) : undefined
    if (seasonForm.referenceYearEnd && Number.isNaN(referenceYearEnd)) {
      setLocalError('Ano de referência final inválido.')
      return
    }

    const created = await createSeason({
      name: seasonForm.name.trim(),
      label: seasonForm.label.trim(),
      season: seasonForm.season.trim(),
      status: seasonForm.status as 'draft' | 'published' | 'archived',
      referenceYearStart,
      referenceYearEnd,
      startAt: seasonForm.startAt || undefined,
      endAt: seasonForm.endAt || undefined,
      meta,
    })
    if (created) {
      toast.success('Temporada criada.')
    }
  }

  const handleUpdateSeason = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!selectedSeason) {
      setLocalError('Selecione uma temporada para editar.')
      return
    }
    if (!seasonForm.name.trim() || !seasonForm.season.trim() || !seasonForm.label.trim()) {
      setLocalError('Nome, label e temporada são obrigatórios.')
      return
    }
    if (!seasonForm.referenceYearStart.trim()) {
      setLocalError('Ano de referência inicial é obrigatório.')
      return
    }

    let meta: JsonValue | undefined
    try {
      meta = seasonForm.meta.trim() ? parseJsonField(seasonForm.meta, 'Meta da temporada') : undefined
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível validar a temporada.')
      return
    }

    const referenceYearStart = Number(seasonForm.referenceYearStart)
    if (Number.isNaN(referenceYearStart)) {
      setLocalError('Ano de referência inicial inválido.')
      return
    }
    const referenceYearEnd = seasonForm.referenceYearEnd ? Number(seasonForm.referenceYearEnd) : undefined
    if (seasonForm.referenceYearEnd && Number.isNaN(referenceYearEnd)) {
      setLocalError('Ano de referência final inválido.')
      return
    }

    const updated = await updateSeason(selectedSeason.id, {
      name: seasonForm.name.trim(),
      label: seasonForm.label.trim(),
      season: seasonForm.season.trim(),
      status: seasonForm.status as 'draft' | 'published' | 'archived',
      referenceYearStart,
      referenceYearEnd,
      startAt: seasonForm.startAt || undefined,
      endAt: seasonForm.endAt || undefined,
      meta,
    })
    if (updated) {
      toast.success('Temporada atualizada.')
    }
  }

  const handleConfigSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!selectedSeason) {
      setLocalError('Selecione uma temporada para editar a configuração.')
      return
    }

    let parsed: JsonValue
    try {
      parsed = parseJsonField(configText, 'Config overrides')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível validar a configuração.')
      return
    }

    const updated = await updateSeasonConfig(selectedSeason.id, parsed)
    if (updated) {
      toast.success('Configuração da temporada atualizada.')
    }
  }

  const handleRulesSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    if (!selectedSeason) {
      setLocalError('Selecione uma temporada para editar as regras.')
      return
    }

    try {
      const tiebreakers = rulesForm.tiebreakers
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      if (!tiebreakers.length) {
        throw new Error('Informe ao menos um critério de desempate.')
      }

      const updated = await updateSeasonHandballRules(selectedSeason.id, {
        pointsForWin: parseRuleNumber(rulesForm.pointsForWin, 'Vitória'),
        pointsForDraw: parseRuleNumber(rulesForm.pointsForDraw, 'Empate'),
        pointsForLoss: parseRuleNumber(rulesForm.pointsForLoss, 'Derrota'),
        pointsForOvertimeWin: parseRuleNumber(rulesForm.pointsForOvertimeWin, 'Vitória na prorrogação'),
        pointsForOvertimeLoss: parseRuleNumber(rulesForm.pointsForOvertimeLoss, 'Derrota na prorrogação'),
        pointsForPenaltyWin: parseRuleNumber(rulesForm.pointsForPenaltyWin, 'Vitória nos pênaltis'),
        pointsForPenaltyLoss: parseRuleNumber(rulesForm.pointsForPenaltyLoss, 'Derrota nos pênaltis'),
        allowDraws: rulesForm.allowDraws,
        tiebreakers,
      })
      if (updated) {
        toast.success('Regras da temporada atualizadas.')
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Não foi possível validar as regras.')
    }
  }

  const mustSelectSeason = seasons.length > 1 && !selectedSeasonId
  const noSeason = seasons.length === 0

  useEffect(() => {
    if (noSeason) {
      setSeasonFormOpen(true)
      if (workspaceSection !== 'general') {
        setWorkspaceSection('seasons')
      }
    }
  }, [noSeason, workspaceSection])

  if (loading || !competition) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Gerenciar competição" description="Carregando dados...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando competição...</span>
          </div>
        </PageWrapper>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={editor.refetch} refreshing={savingCompetition || savingSeason || savingConfig || savingRules || removingCompetition || removingSeason}>
      <PageWrapper
        title={`Gerenciar competição • ${competition.name}`}
        description="Competição fixa + temporadas operacionais. Selecione a temporada para operar."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/competitions')}>
              Voltar
            </Button>
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmCompetitionOpen(true)} disabled={removingCompetition}>
              <Trash2 className="h-4 w-4" />
              Excluir competição
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {(error || localError || success) && (
            <AlertBanner
              variant={error || localError ? 'error' : 'success'}
              message={localError ?? error ?? undefined}
              title={success ?? undefined}
            />
          )}

          {mustSelectSeason && (
            <AlertBanner
              variant="warning"
              title="Seleção obrigatória de temporada"
              message="Esta competição possui múltiplas temporadas. Selecione uma temporada antes de operar."
            />
          )}

          {noSeason && (
            <AlertBanner
              variant="warning"
              title="Competição sem temporada"
              message="Crie a primeira temporada para habilitar configurações e operações."
            />
          )}
        </div>

        <div className="mt-6 space-y-6">
          <div className="card space-y-5 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textSecondary">Workspace da competição</p>
                <h3 className="text-xl font-semibold text-textPrimary">{competition.name}</h3>
                <p className="text-sm text-textSecondary">
                  {competition.typeName ?? 'Tipo não informado'} • navegação secundária para separar contexto geral, temporada e operação.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
                <div className="rounded-xl border border-borderSoft bg-surface-contrast p-4">
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Competição fixa</p>
                  <p className="mt-2 text-sm font-semibold text-textPrimary">{competition.scope} • {competition.status}</p>
                  <p className="text-xs text-textSecondary">{competition.category ?? 'Categoria não informada'}</p>
                </div>
                <div className="rounded-xl border border-borderSoft bg-surface-contrast p-4">
                  <p className="text-xs uppercase tracking-wide text-textSecondary">Temporada ativa</p>
                  <p className="mt-2 text-sm font-semibold text-textPrimary">
                    {selectedSeason ? `${selectedSeason.label ?? selectedSeason.name}${selectedSeason.season ? ` • ${selectedSeason.season}` : ''}` : 'Nenhuma'}
                  </p>
                  <p className="text-xs text-textSecondary">
                    {selectedSeason ? `Status: ${selectedSeason.status}` : 'Selecione uma temporada para operar.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Temporada operacional</span>
                <Select
                  value={selectedSeasonId ?? selectedSeason?.id ?? ''}
                  onChange={(event) => selectSeason(event.target.value || null)}
                  disabled={seasons.length === 0}
                >
                  <option value="">Selecionar temporada</option>
                  {seasonOptions.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.label}{season.detail ? ` • ${season.detail}` : ''}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWorkspaceSection('seasons')
                    setSeasonFormOpen((prev) => !prev)
                  }}
                >
                  {seasonFormOpen ? 'Ocultar formulário' : selectedSeason ? 'Editar temporada' : 'Criar temporada'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Tabs
                options={workspaceOptions.map((option) => {
                  const Icon = option.icon
                  return {
                    value: option.value,
                    label: option.label,
                    icon: <Icon className="h-4 w-4" />,
                  }
                })}
                value={workspaceSection}
                onChange={(value) => setWorkspaceSection(value as WorkspaceSection)}
                className="w-full overflow-x-auto rounded-xl"
              />
              <p className="px-1 text-xs text-textSecondary">
                {workspaceOptions.find((option) => option.value === workspaceSection)?.helper}
              </p>
            </div>
          </div>

          {workspaceSection === 'general' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="card space-y-5 p-6">
                <div>
                  <p className="text-base font-semibold text-textPrimary">Geral da competição</p>
                  <p className="text-sm text-textSecondary">Dados fixos da entidade `Competition`, sem acoplamento direto a inscrições ou jogo.</p>
                </div>

                <form className="space-y-4" onSubmit={handleCompetitionSubmit}>
                  <label className="space-y-2 text-sm">
                    <span className="text-textSecondary">Nome *</span>
                    <Input
                      value={competitionForm.name}
                      onChange={(event) => setCompetitionForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-textSecondary">Tipo *</span>
                    <Select
                      value={competitionForm.typeId}
                      onChange={(event) => setCompetitionForm((prev) => ({ ...prev, typeId: event.target.value }))}
                      disabled={catalogs.loading}
                      required
                    >
                      <option value="">Selecione o tipo</option>
                      {catalogs.competitionTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">País</span>
                      <Select
                        value={competitionForm.countryId}
                        onChange={(event) => setCompetitionForm((prev) => ({ ...prev, countryId: event.target.value }))}
                        disabled={catalogs.loading}
                      >
                        <option value="">Sem país</option>
                        {catalogs.countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Locale</span>
                      <Input
                        value={competitionForm.locale}
                        onChange={(event) => setCompetitionForm((prev) => ({ ...prev, locale: event.target.value }))}
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Status</span>
                      <Select
                        value={competitionForm.status}
                        onChange={(event) => setCompetitionForm((prev) => ({ ...prev, status: event.target.value }))}
                      >
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicada</option>
                        <option value="archived">Arquivada</option>
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Escopo</span>
                      <Select
                        value={competitionForm.scope}
                        onChange={(event) => setCompetitionForm((prev) => ({ ...prev, scope: event.target.value }))}
                      >
                        <option value="national">Nacional</option>
                        <option value="state">Estadual</option>
                        <option value="international">Internacional</option>
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Naipe</span>
                      <Select
                        value={competitionForm.naipe}
                        onChange={(event) => setCompetitionForm((prev) => ({ ...prev, naipe: event.target.value }))}
                      >
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="misto">Misto</option>
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Categoria</span>
                      <Input
                        value={competitionForm.category}
                        onChange={(event) => setCompetitionForm((prev) => ({ ...prev, category: event.target.value }))}
                      />
                    </label>
                  </div>
                  <details className="rounded-lg border border-borderSoft bg-surface-contrast p-3 text-sm">
                    <summary className="cursor-pointer text-textSecondary">Meta (JSON opcional)</summary>
                    <textarea
                      value={competitionForm.meta}
                      onChange={(event) => setCompetitionForm((prev) => ({ ...prev, meta: event.target.value }))}
                      className="field-area mt-3 min-h-28"
                    />
                  </details>
                  <Button type="submit" disabled={savingCompetition} className="gap-2">
                    {savingCompetition ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingCompetition ? 'Salvando...' : 'Salvar competição'}
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="card space-y-3 p-5">
                    <p className="text-sm font-semibold text-textPrimary">Resumo operacional</p>
                    <div className="space-y-2 text-sm text-textSecondary">
                      <p><span className="font-medium text-textPrimary">Temporadas:</span> {seasons.length}</p>
                      <p><span className="font-medium text-textPrimary">Temporada atual:</span> {selectedSeason?.label ?? 'Nenhuma'}</p>
                      <p><span className="font-medium text-textPrimary">Escopo:</span> {competition.scope}</p>
                      <p><span className="font-medium text-textPrimary">Naipe:</span> {competition.naipe ?? '—'}</p>
                    </div>
                  </div>
                  <div className="card space-y-3 p-5">
                    <p className="text-sm font-semibold text-textPrimary">Como navegar</p>
                    <p className="text-sm text-textSecondary">
                      Use `Temporadas` para gerir o contexto sazonal. Use `Inscrições`, `Configuração` e `Regras` como áreas operacionais da temporada selecionada.
                    </p>
                  </div>
                </div>

                {selectedType && (
                  <details className="rounded-lg border border-borderSoft bg-surface-contrast p-4 text-sm text-textSecondary">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-textSecondary">
                      Defaults do tipo
                    </summary>
                    <pre className="mt-3 overflow-x-auto text-xs text-textSecondary">
                      {formatJson(selectedType.defaults ?? {})}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {workspaceSection === 'seasons' && (
            <div className="space-y-6">
              <div className="card space-y-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-textPrimary">Temporadas</p>
                    <p className="text-sm text-textSecondary">Gerencie a edição operacional sem misturar configuração, regras e inscrições na mesma superfície.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-borderSoft p-4">
                      <p className="text-xs uppercase tracking-wide text-textSecondary">Total</p>
                      <p className="text-lg font-semibold text-textPrimary">{seasons.length}</p>
                    </div>
                    <div className="rounded-xl border border-borderSoft p-4 md:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-textSecondary">Selecionada</p>
                      <p className="text-sm text-textPrimary">
                        {selectedSeason ? `${selectedSeason.label ?? selectedSeason.name}${selectedSeason.season ? ` • ${selectedSeason.season}` : ''}` : 'Nenhuma'}
                      </p>
                      {selectedSeason && <p className="text-xs text-textSecondary">Status: {selectedSeason.status}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {seasonFormOpen && (
                <form className="card space-y-4 p-6" onSubmit={selectedSeason ? handleUpdateSeason : handleCreateSeason}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-textPrimary">
                        {selectedSeason ? 'Editar temporada' : 'Criar temporada'}
                      </p>
                      <p className="text-sm text-textSecondary">
                        Use o formulário para criar ou ajustar a temporada operacional.
                      </p>
                    </div>
                    {selectedSeason && (
                      <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmSeasonOpen(true)} disabled={removingSeason}>
                        <Trash2 className="h-4 w-4" />
                        Excluir temporada
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Nome *</span>
                      <Input
                        value={seasonForm.name}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, name: event.target.value }))}
                        required
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Label *</span>
                      <Input
                        value={seasonForm.label}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, label: event.target.value }))}
                        required
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Temporada *</span>
                      <Input
                        value={seasonForm.season}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, season: event.target.value }))}
                        placeholder="2025 ou 2025/26"
                        required
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Ano referência início *</span>
                      <Input
                        type="number"
                        value={seasonForm.referenceYearStart}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, referenceYearStart: event.target.value }))}
                        placeholder="2026"
                        required
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Ano referência fim</span>
                      <Input
                        type="number"
                        value={seasonForm.referenceYearEnd}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, referenceYearEnd: event.target.value }))}
                        placeholder="2027"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Status</span>
                      <Select
                        value={seasonForm.status}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, status: event.target.value }))}
                      >
                        <option value="draft">Rascunho</option>
                        <option value="published">Publicada</option>
                        <option value="archived">Arquivada</option>
                      </Select>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Início (ISO)</span>
                      <Input
                        value={seasonForm.startAt}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, startAt: event.target.value }))}
                        placeholder="2026-01-10T12:00:00Z"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-textSecondary">Fim (ISO)</span>
                      <Input
                        value={seasonForm.endAt}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, endAt: event.target.value }))}
                        placeholder="2026-11-10T12:00:00Z"
                      />
                    </label>
                    <label className="space-y-2 text-sm md:col-span-2">
                      <span className="text-textSecondary">Meta (JSON opcional)</span>
                      <textarea
                        value={seasonForm.meta}
                        onChange={(event) => setSeasonForm((prev) => ({ ...prev, meta: event.target.value }))}
                        className="field-area min-h-28"
                      />
                    </label>
                  </div>

                  <Button type="submit" disabled={savingSeason} className="gap-2">
                    {savingSeason ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingSeason ? 'Salvando...' : selectedSeason ? 'Salvar temporada' : 'Criar temporada'}
                  </Button>
                </form>
              )}

              {noSeason && !seasonFormOpen && (
                <div className="card flex flex-col gap-3 p-6">
                  <p className="text-base font-semibold text-textPrimary">Nenhuma temporada cadastrada</p>
                  <p className="text-sm text-textSecondary">
                    Crie a primeira temporada para habilitar configurações, regras e operações da competição.
                  </p>
                  <Button type="button" className="self-start" onClick={() => setSeasonFormOpen(true)}>
                    Criar primeira temporada
                  </Button>
                </div>
              )}
            </div>
          )}

          {workspaceSection === 'registrations' && selectedSeason && !mustSelectSeason && !noSeason && (
            <SeasonRegistrationsPanel
              season={selectedSeason}
              competitionContext={{
                name: competition.name,
                scope: competition.scope,
                country: competition.country?.name,
              }}
            />
          )}

          {workspaceSection === 'config' && selectedSeason && !mustSelectSeason && !noSeason && (
            <form className="card space-y-5 p-6" onSubmit={handleConfigSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-textPrimary">Configuração da temporada</p>
                  <p className="text-sm text-textSecondary">
                    {'Atualiza `PATCH /api/v1/auth/competition-seasons/{competitionSeason}/config` com o campo `overrides`.'}
                  </p>
                </div>
                <Button type="submit" disabled={savingConfig || !selectedSeason} className="gap-2">
                  {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingConfig ? 'Salvando...' : 'Salvar config'}
                </Button>
              </div>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Overrides (JSON)</span>
                <textarea
                  value={configText}
                  onChange={(event) => setConfigText(event.target.value)}
                  disabled={!selectedSeason}
                  className="field-area min-h-48"
                />
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                {selectedType && (
                  <details className="rounded-xl border border-borderSoft bg-surface-muted p-4 text-sm text-textSecondary">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-textSecondary">Defaults do tipo</summary>
                    <pre className="mt-3 overflow-x-auto text-xs text-textSecondary">
                      {formatJson(selectedType.defaults ?? {})}
                    </pre>
                  </details>
                )}
                <details className="rounded-xl border border-borderSoft bg-surface-muted p-4 text-sm text-textSecondary">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-textSecondary">Effective config</summary>
                  <pre className="mt-3 overflow-x-auto text-xs text-textSecondary">
                    {formatJson(selectedSeason?.effectiveConfig ?? {})}
                  </pre>
                </details>
              </div>
            </form>
          )}

          {workspaceSection === 'rules' && selectedSeason && !mustSelectSeason && !noSeason && (
            <form className="card space-y-5 p-6" onSubmit={handleRulesSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-textPrimary">Regras de handebol (temporada)</p>
                  <p className="text-sm text-textSecondary">
                    {'Atualiza `PATCH /api/v1/auth/competition-seasons/{competitionSeason}/handball-rules`.'}
                  </p>
                </div>
                <Button type="submit" disabled={savingRules || !selectedSeason} className="gap-2">
                  {savingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingRules ? 'Salvando...' : 'Salvar regras'}
                </Button>
              </div>

              {!resolvedHandballRule && (
                <AlertBanner
                  variant="warning"
                  title="Regras não encontradas"
                  message="Não foi localizado um bloco de regras persistido para esta temporada. Ajuste e salve para configurar."
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Pontos por vitória</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForWin}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForWin: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Pontos por empate</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForDraw}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForDraw: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Pontos por derrota</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForLoss}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForLoss: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Vitória na prorrogação</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForOvertimeWin}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForOvertimeWin: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Derrota na prorrogação</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForOvertimeLoss}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForOvertimeLoss: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Vitória nos pênaltis</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForPenaltyWin}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForPenaltyWin: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-textSecondary">Derrota nos pênaltis</span>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={rulesForm.pointsForPenaltyLoss}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, pointsForPenaltyLoss: event.target.value }))}
                    disabled={!selectedSeason}
                  />
                </label>
                <label className="flex items-center gap-3 rounded-md border border-borderSoft bg-surface-elevated px-3 py-3 text-sm text-textPrimary">
                  <input
                    type="checkbox"
                    checked={rulesForm.allowDraws}
                    onChange={(event) => setRulesForm((prev) => ({ ...prev, allowDraws: event.target.checked }))}
                    disabled={!selectedSeason}
                    className="h-4 w-4 accent-primary"
                  />
                  Permitir empates
                </label>
              </div>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Critérios de desempate</span>
                <Input
                  value={rulesForm.tiebreakers}
                  onChange={(event) => setRulesForm((prev) => ({ ...prev, tiebreakers: event.target.value }))}
                  placeholder="points, goal_diff, goals_for"
                  disabled={!selectedSeason}
                />
                <p className="text-xs text-textSecondary">Informe os slugs separados por vírgula exatamente como o backend espera.</p>
              </label>

              <details className="rounded-xl border border-borderSoft bg-surface-muted p-4 text-sm text-textSecondary">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-textSecondary">Regras atuais</summary>
                <pre className="mt-3 overflow-x-auto text-xs text-textSecondary">
                  {formatJson(selectedSeason?.handballRule ? (selectedSeason.handballRule as unknown as JsonValue) : {})}
                </pre>
              </details>
            </form>
          )}

          {workspaceSection !== 'general' && (!selectedSeason || mustSelectSeason) && !noSeason && (
            <div className="card flex items-start gap-3 p-5">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-textPrimary">Selecione uma temporada</p>
                <p className="text-textSecondary">
                  Escolha uma temporada para liberar configurações, regras e operações sazonais.
                </p>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>

      <ConfirmModal
        open={confirmCompetitionOpen}
        title="Confirmar exclusão"
        description={`A competição "${competition.name}" será removida. Deseja continuar?`}
        confirmLabel="Excluir competição"
        onCancel={() => setConfirmCompetitionOpen(false)}
        onConfirm={async () => {
          setConfirmCompetitionOpen(false)
          const removed = await removeCompetition()
          if (removed) {
            toast.success('Competição removida.')
            router.push('/competitions')
          }
        }}
      />

      <ConfirmModal
        open={confirmSeasonOpen}
        title="Confirmar exclusão de temporada"
        description="A temporada selecionada será removida. Deseja continuar?"
        confirmLabel="Excluir temporada"
        onCancel={() => setConfirmSeasonOpen(false)}
        onConfirm={async () => {
          setConfirmSeasonOpen(false)
          if (selectedSeason) {
            const removed = await removeSeason(selectedSeason.id)
            if (removed) {
              toast.success('Temporada removida.')
            }
          }
        }}
      />

      {ToastViewport ? (
        <ToastViewport
          position="bottom-right"
          theme="dark"
          autoClose={2600}
          newestOnTop
        />
      ) : null}
    </DashboardShell>
  )
}
