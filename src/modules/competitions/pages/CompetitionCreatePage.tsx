'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw, Save, Shield } from 'lucide-react'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useCompetitionCatalogs } from '../hooks/useCompetitionCatalogs'
import { CompetitionsGateway } from '../services/competitions.service'
import type { JsonValue } from '../types'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'

function formatJson(value: JsonValue) {
  return JSON.stringify(value, null, 2)
}

function parseJsonField(value: string, fieldLabel: string): JsonValue | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

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

export function CompetitionCreatePage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const { competitionTypes, countries, loading, error, refetch } = useCompetitionCatalogs()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [form, setForm] = useState({
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

  const selectedType = useMemo(
    () => competitionTypes.find((type) => type.id === form.typeId) ?? null,
    [competitionTypes, form.typeId],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setCreatedId(null)

    if (!form.name.trim()) {
      setSubmitError('Nome é obrigatório.')
      return
    }
    if (!form.typeId) {
      setSubmitError('Selecione um tipo de competição.')
      return
    }

    let meta: JsonValue | undefined
    try {
      meta = parseJsonField(form.meta, 'Meta')
    } catch (err) {
      setSubmitError(resolveMatchActionError(err, 'Não foi possível validar o formulário.'))
      return
    }

    setSubmitting(true)
    try {
      const created = await CompetitionsGateway.create({
        name: form.name.trim(),
        typeId: form.typeId,
        locale: form.locale.trim() || 'pt-BR',
        status: form.status as 'draft' | 'published' | 'archived',
        countryId: form.countryId || undefined,
        scope: form.scope as 'national' | 'state' | 'international',
        naipe: form.naipe as 'masculino' | 'feminino' | 'misto',
        category: form.category.trim() || undefined,
        meta,
      })
      setCreatedId(created.id)
    } catch (err) {
      setSubmitError(resolveMatchActionError(err, 'Não foi possível criar a competição.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch} refreshing={loading}>
      <PageWrapper
        title="Nova competição"
        description="Crie a entidade fixa da competição. A temporada será criada na próxima etapa."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/competitions')} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Voltar para lista
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <form className="card space-y-5 p-6 lg:col-span-2" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-textPrimary">Dados da competição</p>
                <p className="text-sm text-textSecondary">O formulário cria somente a competição fixa.</p>
              </div>
            </div>

            {(error || submitError) && (
              <AlertBanner variant="error" message={submitError ?? error ?? undefined} />
            )}

            {createdId && (
              <AlertBanner variant="success" title="Competição criada">
                <p className="text-sm text-textSecondary">
                  A competição foi criada. Agora cadastre a primeira temporada para habilitar operações.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => router.push(`/competitions/${createdId}/edit`)}>
                    Criar temporada
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => router.push('/competitions')}>
                    Voltar para listagem
                  </Button>
                </div>
              </AlertBanner>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Nome *</span>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Tipo *</span>
                <Select
                  value={form.typeId}
                  onChange={(event) => setForm((prev) => ({ ...prev, typeId: event.target.value }))}
                  disabled={loading}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {competitionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">País</span>
                <Select
                  value={form.countryId}
                  onChange={(event) => setForm((prev) => ({ ...prev, countryId: event.target.value }))}
                  disabled={loading}
                >
                  <option value="">Sem país</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Locale</span>
                <Input
                  value={form.locale}
                  onChange={(event) => setForm((prev) => ({ ...prev, locale: event.target.value }))}
                  placeholder="pt-BR"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Status</span>
                <Select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicada</option>
                  <option value="archived">Arquivada</option>
                </Select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Escopo</span>
                <Select
                  value={form.scope}
                  onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))}
                >
                  <option value="national">Nacional</option>
                  <option value="state">Estadual</option>
                  <option value="international">Internacional</option>
                </Select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-textSecondary">Naipe</span>
                <Select
                  value={form.naipe}
                  onChange={(event) => setForm((prev) => ({ ...prev, naipe: event.target.value }))}
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="misto">Misto</option>
                </Select>
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-textSecondary">Categoria</span>
                <Input
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Adulto, Sub-18..."
                />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-textSecondary">Meta (JSON opcional)</span>
                <textarea
                  value={form.meta}
                  onChange={(event) => setForm((prev) => ({ ...prev, meta: event.target.value }))}
                  placeholder='{"edition": 1}'
                  className="min-h-32 w-full rounded-md border border-borderSoft bg-surface-elevated px-3 py-3 text-sm text-textPrimary shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.push('/competitions')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || loading} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {submitting ? 'Criando...' : 'Criar competição'}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="card space-y-3 p-5">
              <p className="text-sm font-semibold text-textPrimary">Próximo passo</p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• A competição fixa não possui dados operacionais.</li>
                <li>• A temporada é obrigatória para configurar regras, standings e partidas.</li>
              </ul>
            </div>

            <div className="card space-y-3 p-5">
              <p className="text-sm font-semibold text-textPrimary">Tipo selecionado</p>
              {!selectedType ? (
                <p className="text-sm text-textSecondary">Selecione um tipo para visualizar descrição e defaults retornados por `competition-types`.</p>
              ) : (
                <>
                  <div>
                    <p className="text-base font-semibold text-textPrimary">{selectedType.name}</p>
                    {selectedType.description && <p className="text-sm text-textSecondary">{selectedType.description}</p>}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-textSecondary">Defaults</p>
                    <pre className="overflow-x-auto rounded-xl border border-borderSoft bg-surface-muted p-3 text-xs text-textSecondary">
                      {formatJson(selectedType.defaults ?? {})}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </DashboardShell>
  )
}
