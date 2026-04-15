'use client'

import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Loader2, Pencil, Trash2 } from 'lucide-react'
import { AlertBanner } from '@/components/AlertBanner'
import { ConfirmModal } from '@/components/ConfirmModal'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import type { AuthProfile } from '@/services/auth.service'
import { useState } from 'react'
import { PlayerTransferModal } from '../components/PlayerTransferModal'
import { usePlayerCatalogs } from '../hooks/usePlayerCatalogs'
import { usePlayerEditor } from '../hooks/usePlayerEditor'

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-textSecondary">{title}</p>
      </div>
      {children}
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-borderSofter pb-3 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between">
      <span className="text-sm text-textSecondary">{label}</span>
      <span className="text-sm font-medium text-textPrimary">{value}</span>
    </div>
  )
}

export function PlayerDetailPage({ currentUser, playerId }: { currentUser: AuthProfile; playerId: string }) {
  const router = useRouter()
  const { teams, error: catalogError, refetch: refetchCatalogs } = usePlayerCatalogs()
  const { detail, loading, saving, error, success, transfer, remove, refetch, setError } = usePlayerEditor(playerId)
  const [transferOpen, setTransferOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (loading || !detail) {
    return (
      <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
        <PageWrapper title="Detalhe do atleta" description="Carregando dados...">
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
      refreshing={saving}
    >
      <PageWrapper
        title={detail.fullName}
        description="Consulta operacional do cadastro-base do atleta e ponto de entrada para transferência entre equipes."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/players')}>
              Voltar
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="h-4 w-4" />
              Transferir atleta
            </Button>
            <Button size="sm" variant="secondary" className="gap-2" onClick={() => router.push(`/players/${playerId}/edit`)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button size="sm" variant="ghost" className="gap-2 text-primary" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {(error || catalogError) && <AlertBanner variant="warning" message={error ?? catalogError ?? undefined} />}
          {success && <AlertBanner variant="success" message={success} />}
          <AlertBanner
            variant="info"
            title="Segurança de transferência"
            message="Se existirem inscrições sazonais ativas vinculadas ao atleta, o backend bloqueia a operação com erro 422 explícito. Nenhuma migração automática é executada."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DetailCard title="Cadastro">
            <DetailRow label="Nome completo" value={detail.fullName} />
            <DetailRow label="Apelido" value={detail.nickname ?? '—'} />
            <DetailRow label="Status" value={detail.isActive ? 'Ativo' : 'Inativo'} />
            <DetailRow label="Número base" value={detail.number !== null && detail.number !== undefined ? String(detail.number) : '—'} />
            <DetailRow label="Nascimento" value={formatDate(detail.birthdate)} />
            <DetailRow label="Nacionalidade" value={detail.nationality ?? '—'} />
          </DetailCard>

          <DetailCard title="Vínculos">
            <DetailRow label="Equipe base" value={detail.team?.name ?? 'Sem equipe base'} />
            <DetailRow label="Sigla da equipe" value={detail.team?.shortName ?? '—'} />
            <DetailRow label="Posição" value={detail.position?.name ?? '—'} />
            <DetailRow label="Código da posição" value={detail.position?.code ?? '—'} />
            <DetailRow label="Criado em" value={formatDate(detail.createdAt)} />
            <DetailRow label="Atualizado em" value={formatDate(detail.updatedAt)} />
          </DetailCard>
        </div>
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
        description={`O atleta "${detail.fullName}" só será removido se não houver histórico de partidas, notícias ou inscrições vinculadas.`}
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
