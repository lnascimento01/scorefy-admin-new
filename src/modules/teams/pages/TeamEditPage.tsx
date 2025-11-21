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
import type { TeamStatus } from '../types'
import { useTeamEditor } from '../hooks/useTeamEditor'

const statusLabel: Record<TeamStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  draft: 'Em formação'
}

export function TeamEditPage({ currentUser, teamId }: { currentUser: AuthProfile; teamId: string }) {
  const router = useRouter()
  const { detail, loading, saving, error, success, refetch, update, remove } = useTeamEditor(teamId)
  const [localError, setLocalError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const initial = useMemo(() => detail, [detail])
  const [form, setForm] = useState(() => ({
    name: '',
    shortName: '',
    city: '',
    state: '',
    country: '',
    category: '',
    gender: '',
    coach: '',
    status: 'active' as TeamStatus,
    totalPlayers: '',
    foundedAt: ''
  }))

  useMemo(() => {
    if (!initial) return form
    setForm({
      name: initial.name,
      shortName: initial.shortName ?? '',
      city: initial.city ?? '',
      state: initial.state ?? '',
      country: initial.country ?? '',
      category: initial.category ?? '',
      gender: initial.gender ?? '',
      coach: initial.coach ?? '',
      status: initial.status,
      totalPlayers: initial.totalPlayers?.toString() ?? '',
      foundedAt: initial.foundedAt ?? ''
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
      shortName: form.shortName || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      category: form.category || undefined,
      gender: form.gender || undefined,
      coach: form.coach || undefined,
      status: form.status,
      totalPlayers: form.totalPlayers ? Number(form.totalPlayers) : undefined,
      foundedAt: form.foundedAt || undefined
    })
  }

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
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email} onRefresh={refetch} refreshing={saving}>
      <PageWrapper
        title={`Editar equipe • ${detail.name}`}
        description="Atualize informações básicas. Remova somente se tiver certeza."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/teams')}>
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
              <span className="text-textSecondary">Abreviação</span>
              <Input value={form.shortName} onChange={(e) => setForm((prev) => ({ ...prev, shortName: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Cidade</span>
              <Input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Estado</span>
              <Input value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
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
              <span className="text-textSecondary">Gênero</span>
              <Input value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Técnico</span>
              <Input value={form.coach} onChange={(e) => setForm((prev) => ({ ...prev, coach: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Status</span>
              <Select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TeamStatus }))}
              >
                <option value="active">Ativa</option>
                <option value="draft">Em formação</option>
                <option value="inactive">Inativa</option>
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Total de atletas</span>
              <Input
                type="number"
                value={form.totalPlayers}
                onChange={(e) => setForm((prev) => ({ ...prev, totalPlayers: e.target.value }))}
                min={0}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textSecondary">Fundação (ISO)</span>
              <Input value={form.foundedAt} onChange={(e) => setForm((prev) => ({ ...prev, foundedAt: e.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.push('/teams')}>
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
        description={`A equipe "${detail.name}" será removida. Deseja continuar?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          remove()
            .then(() => {
              router.push('/teams')
            })
            .catch(() => undefined)
        }}
      />
    </DashboardShell>
  )
}
