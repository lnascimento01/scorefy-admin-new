'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Trash2 } from 'lucide-react'
import type { AuthProfile } from '@/services/auth.service'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useCompetitionEditor } from '../hooks/useCompetitionEditor'
import type { CompetitionSummary } from '../types'

export function CompetitionEditPage({ currentUser, competitionId }: { currentUser: AuthProfile; competitionId: string }) {
  const router = useRouter()
  const { detail, loading, saving, error, success, refetch, update, remove } = useCompetitionEditor(competitionId)
  const [localError, setLocalError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const initial = useMemo(() => detail, [detail])
  const [form, setForm] = useState(() => ({
    name: '',
    season: '',
    type: '',
    country: '',
    category: '',
    scope: '',
    naipe: '',
    metaSummary: ''
  }))

  useMemo(() => {
    if (!initial) return form
    setForm({
      name: initial.name,
      season: initial.season ?? '',
      type: initial.type ?? '',
      country: initial.country ?? '',
      category: initial.category ?? '',
      scope: initial.scope ?? '',
      naipe: initial.naipe ?? '',
      metaSummary: initial.metaSummary ?? ''
    })
    return form
  }, [initial])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)
    if (!form.name.trim()) {
      setLocalError('Nome é obrigatório.')
      return
    }
    await update({
      name: form.name,
      season: form.season || undefined,
      type: form.type || undefined,
      country: form.country || undefined,
      category: form.category || undefined,
      scope: form.scope || undefined,
      naipe: form.naipe || undefined,
      metaSummary: form.metaSummary || undefined
    })
  }

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Editar competição" description="Carregando dados...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando competição...</span>
          </div>
        </PageWrapper>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch} refreshing={saving}>
      <PageWrapper
        title={`Editar competição • ${detail.name}`}
        description="Atualize as informações da competição."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/competitions')}>
              Voltar
            </Button>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setConfirmOpen(true)} disabled={saving}>
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </div>
        }
      >
        <form className="card space-y-5 p-6" onSubmit={handleSubmit}>
          {(error || localError || success) && (
            <AlertBanner
              variant={error || localError ? 'error' : 'success'}
              message={localError ?? error ?? undefined}
              title={success ?? undefined}
            />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Nome</span>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Temporada</span>
              <Input value={form.season} onChange={(e) => setForm((prev) => ({ ...prev, season: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Tipo</span>
              <Input value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">País</span>
              <Input value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Categoria</span>
              <Input value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Escopo</span>
              <Input value={form.scope} onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Naipe</span>
              <Input value={form.naipe} onChange={(e) => setForm((prev) => ({ ...prev, naipe: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-textSecondary">Resumo de meta (opcional)</span>
              <Input
                value={form.metaSummary}
                onChange={(e) => setForm((prev) => ({ ...prev, metaSummary: e.target.value }))}
                placeholder="JSON ou notas curtas"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/competitions')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </PageWrapper>

      <ConfirmModal
        open={confirmOpen}
        title="Confirmar remoção"
        description={`A competição "${detail.name}" será removida. Deseja continuar?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          remove()
            .then(() => router.push('/competitions'))
            .catch(() => undefined)
        }}
      />
    </DashboardShell>
  )
}
