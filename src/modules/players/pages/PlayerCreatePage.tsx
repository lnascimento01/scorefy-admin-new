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
import { PlayerForm } from '../components/PlayerForm'
import { usePlayerCatalogs } from '../hooks/usePlayerCatalogs'
import { PlayersGateway } from '../services/players.service'
import { EMPTY_PLAYER_FORM, formValuesToPayload } from '../utils/forms'
import type { PlayerFormValues } from '../types'

export function PlayerCreatePage({ currentUser }: { currentUser: AuthProfile }) {
  const router = useRouter()
  const { teams, positions, loading, error, refetch } = usePlayerCatalogs()
  const [form, setForm] = useState<PlayerFormValues>(EMPTY_PLAYER_FORM)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setLocalError('Nome e sobrenome são obrigatórios.')
      return
    }

    setSaving(true)
    try {
      const created = await PlayersGateway.create(formValuesToPayload(form))
      router.push(`/players/${created.id}`)
    } catch (error) {
      setLocalError(resolveMatchActionError(error, 'Não foi possível criar o atleta.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch} refreshing={loading || saving}>
      <PageWrapper
        title="Novo atleta"
        description="Cadastre um atleta usando apenas os campos reais aceitos pelo backend."
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/players')}>
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
          <PlayerForm
            value={form}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/players')}
            submitting={saving}
            submitLabel={saving ? 'Salvando...' : 'Criar atleta'}
            teamOptions={teams}
            positionOptions={positions}
          />
        )}
      </PageWrapper>
    </DashboardShell>
  )
}
