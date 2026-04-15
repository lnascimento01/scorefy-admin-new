'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import type { AuthProfile } from '@/services/auth.service'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PlayerForm } from '../components/PlayerForm'
import { PlayerTransferModal } from '../components/PlayerTransferModal'
import { usePlayerCatalogs } from '../hooks/usePlayerCatalogs'
import { usePlayerEditor } from '../hooks/usePlayerEditor'
import type { PlayerFormValues } from '../types'
import { formValuesToPayload, playerToFormValues } from '../utils/forms'

function PlayerEditFormCard({
  detail,
  teams,
  positions,
  saving,
  onSubmit,
  onCancel,
}: {
  detail: NonNullable<ReturnType<typeof usePlayerEditor>['detail']>
  teams: ReturnType<typeof usePlayerCatalogs>['teams']
  positions: ReturnType<typeof usePlayerCatalogs>['positions']
  saving: boolean
  onSubmit: (payload: ReturnType<typeof formValuesToPayload>) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<PlayerFormValues>(() => playerToFormValues(detail))
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setLocalError('Nome e sobrenome são obrigatórios.')
      return
    }

    const payload = formValuesToPayload(form)
    delete payload.teamId
    await onSubmit(payload)
  }

  return (
    <div className="space-y-2">
      {localError && <AlertBanner variant="warning" message={localError} />}
      <PlayerForm
        value={form}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitting={saving}
        submitLabel={saving ? 'Salvando...' : 'Salvar atleta'}
        teamOptions={teams}
        positionOptions={positions}
        teamDisabled={true}
        teamHint="Trocas de equipe passam pelo fluxo de transferência para evitar inconsistência com inscrições sazonais."
      />
    </div>
  )
}

export function PlayerEditPage({ currentUser, playerId }: { currentUser: AuthProfile; playerId: string }) {
  const router = useRouter()
  const { teams, positions, loading: loadingCatalogs, error: catalogError, refetch: refetchCatalogs } = usePlayerCatalogs()
  const { detail, loading, saving, error, success, update, transfer, remove, refetch, setError } = usePlayerEditor(playerId)
  const [transferOpen, setTransferOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Editar atleta" description="Carregando dados...">
          <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surface-muted px-4 py-3 text-textSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sincronizando atleta...</span>
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
        title={`Editar atleta • ${detail.fullName}`}
        description="A equipe base é alterada exclusivamente pelo fluxo de transferência para preservar a integridade do domínio."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/players/${playerId}`)}>
              Ver detalhe
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Transferir
            </Button>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setConfirmOpen(true)} disabled={saving}>
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
          <PlayerEditFormCard
            key={`${detail.id}:${detail.updatedAt ?? detail.teamId ?? 'static'}`}
            detail={detail}
            teams={teams}
            positions={positions}
            saving={saving}
            onSubmit={async (payload) => {
              await update(payload)
            }}
            onCancel={() => router.push(`/players/${playerId}`)}
          />
        )}
      </PageWrapper>

      <PlayerTransferModal
        key={detail.id}
        open={transferOpen}
        player={detail}
        teams={teams}
        submitting={saving}
        error={error}
        onCancel={() => {
          if (!saving) {
            setTransferOpen(false)
            setError(null)
          }
        }}
        onConfirm={(teamId) => {
          transfer({ teamId }).then((result) => {
            if (result) {
              setTransferOpen(false)
            }
          })
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Confirmar exclusão"
        description={`O atleta "${detail.fullName}" só será removido se não houver histórico associado.`}
        confirmLabel={saving ? 'Excluindo...' : 'Excluir atleta'}
        onCancel={() => {
          if (!saving) {
            setConfirmOpen(false)
            setError(null)
          }
        }}
        onConfirm={() => {
          remove().then((removed) => {
            if (removed) {
              router.push('/players')
            }
          })
        }}
      />
    </DashboardShell>
  )
}
