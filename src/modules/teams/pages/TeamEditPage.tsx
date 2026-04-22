'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import type { AuthProfile } from '@/services/auth.service'
import { TeamForm } from '../components/TeamForm'
import { useTeamCatalogs } from '../hooks/useTeamCatalogs'
import { useTeamEditor } from '../hooks/useTeamEditor'
import type { TeamFormValues, TeamUpsertPayload } from '../types'

function teamToFormValues(team: NonNullable<ReturnType<typeof useTeamEditor>['detail']>): TeamFormValues {
  return {
    name: team.name,
    shortName: team.shortName ?? '',
    slug: team.slug ?? '',
    countryId: team.countryId ?? '',
    city: team.city ?? '',
    colors: team.colors ?? [],
  }
}

function formToPayload(form: TeamFormValues): TeamUpsertPayload {
  return {
    name: form.name.trim(),
    shortName: form.shortName.trim() || null,
    slug: form.slug.trim() || null,
    countryId: form.countryId || null,
    city: form.city.trim() || null,
    colors: form.colors.length ? form.colors : null,
  }
}

function TeamEditFormCard({
  detail,
  countries,
  saving,
  onSubmit,
  onCancel,
}: {
  detail: NonNullable<ReturnType<typeof useTeamEditor>['detail']>
  countries: ReturnType<typeof useTeamCatalogs>['countries']
  saving: boolean
  onSubmit: (payload: TeamUpsertPayload) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<TeamFormValues>(() => teamToFormValues(detail))
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    if (!form.name.trim()) {
      setLocalError('Nome é obrigatório.')
      return
    }

    await onSubmit(formToPayload(form))
  }

  return (
    <div className="space-y-2">
      {localError && <AlertBanner variant="warning" message={localError} />}
      <TeamForm
        value={form}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitting={saving}
        submitLabel={saving ? 'Salvando...' : 'Salvar equipe'}
        countries={countries}
      />
    </div>
  )
}

export function TeamEditPage({ currentUser, teamId }: { currentUser: AuthProfile; teamId: string }) {
  const router = useRouter()
  const { countries, loading: loadingCatalogs, error: catalogError, refetch: refetchCatalogs } = useTeamCatalogs()
  const { detail, loading, saving, error, success, update, remove, refetch, setError } = useTeamEditor(teamId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const formKey = useMemo(() => {
    if (!detail) return teamId
    return `${detail.id}:${detail.updatedAt ?? 'static'}`
  }, [detail, teamId])

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Editar equipe" description="Carregando dados...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando equipe...</span>
          </div>
        </PageWrapper>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      userName={currentUser.name}
      userEmail={currentUser.email}
      onRefresh={() => {
        refetch()
        refetchCatalogs()
      }}
      refreshing={saving || loadingCatalogs}
    >
      <PageWrapper
        title={`Editar equipe • ${detail.name}`}
        description="Ajuste apenas os campos realmente aceitos pelo backend de teams."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/teams')}>
              Voltar
            </Button>
            <Button variant="ghost" size="sm" className="text-primary gap-2" onClick={() => setConfirmOpen(true)} disabled={saving}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        }
      >
        {(error || success || catalogError) && (
          <div className="space-y-2">
            {error && <AlertBanner variant="warning" message={error} />}
            {success && <AlertBanner variant="success" message={success} />}
            {catalogError && <AlertBanner variant="warning" message={catalogError} />}
          </div>
        )}

        {loadingCatalogs ? (
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando catálogos do formulário...</span>
          </div>
        ) : (
          <TeamEditFormCard
            key={formKey}
            detail={detail}
            countries={countries}
            saving={saving}
            onSubmit={async (payload) => {
              await update(payload)
            }}
            onCancel={() => router.push('/teams')}
          />
        )}
      </PageWrapper>

      <ConfirmModal
        open={confirmOpen}
        title="Confirmar exclusão"
        description={`A equipe "${detail.name}" só será removida se não houver vínculos ativos com atletas, partidas, grupos, inscrições sazonais, comissão ou notícias.`}
        confirmLabel={saving ? 'Excluindo...' : 'Excluir equipe'}
        onCancel={() => {
          if (!saving) {
            setConfirmOpen(false)
            setError(null)
          }
        }}
        onConfirm={() => {
          remove().then((removed) => {
            if (removed) {
              router.push('/teams')
            }
          })
        }}
      />
    </DashboardShell>
  )
}
