'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { resolveMatchActionError } from '@/modules/matches/utils/errors'
import type { AuthProfile } from '@/services/auth.service'
import { TeamForm } from '../components/TeamForm'
import { useTeamCatalogs } from '../hooks/useTeamCatalogs'
import { TeamsGateway } from '../services/teams.service'
import type { TeamFormValues } from '../types'

const EMPTY_TEAM_FORM: TeamFormValues = {
  name: '',
  shortName: '',
  slug: '',
  countryId: '',
  city: '',
  colors: [],
}

export function TeamCreatePage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const { countries, loading, error, refetch } = useTeamCatalogs()
  const [form, setForm] = useState<TeamFormValues>(EMPTY_TEAM_FORM)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    if (!form.name.trim()) {
      setLocalError('Nome é obrigatório.')
      return
    }

    setSaving(true)
    try {
      const created = await TeamsGateway.create({
        name: form.name.trim(),
        shortName: form.shortName.trim() || null,
        slug: form.slug.trim() || null,
        countryId: form.countryId || null,
        city: form.city.trim() || null,
        colors: form.colors.length ? form.colors : null,
      })
      router.push(`/teams/${created.id}/edit`)
    } catch (error) {
      setLocalError(resolveMatchActionError(error, 'Não foi possível criar a equipe.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch} refreshing={loading || saving}>
      <PageWrapper
        title="Nova equipe"
        description="Cadastre uma equipe usando apenas os campos aceitos pelo backend atual."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/teams')}>
            Voltar
          </Button>
        }
      >
        {(error || localError) && <AlertBanner variant="warning" message={localError ?? error ?? undefined} />}

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando catálogos do formulário...</span>
          </div>
        ) : (
          <TeamForm
            value={form}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/teams')}
            submitting={saving}
            submitLabel={saving ? 'Salvando...' : 'Criar equipe'}
            countries={countries}
          />
        )}
      </PageWrapper>
    </DashboardShell>
  )
}
