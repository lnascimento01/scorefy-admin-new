'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, FileText, Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AuthProfile } from '@/services/auth.service'
import { AlertBanner } from '@/components/AlertBanner'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { ScoresheetGateway, type ScoresheetPayload } from '@/modules/match-control/services/scoresheet.service'
import { downloadBase64File } from '@/modules/match-control/utils/files'
import type { MatchControlDetail } from '@/modules/match-control/types'
import { MatchesGateway } from '../services/matches.service'
import { formatMatchStatusLabel, getMatchActionCapabilities } from '../utils/status'
import { resolveMatchActionError } from '../utils/errors'

interface ScoresheetPreviewPageProps {
  currentUser: AuthProfile
  matchId: string
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export function ScoresheetPreviewPage({ currentUser, matchId }: ScoresheetPreviewPageProps) {
  const router = useRouter()
  const [match, setMatch] = useState<MatchControlDetail | null>(null)
  const [matchState, setMatchState] = useState<LoadingState>('idle')
  const [scoresheet, setScoresheet] = useState<ScoresheetPayload | null>(null)
  const [scoresheetState, setScoresheetState] = useState<LoadingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [signatureMessage, setSignatureMessage] = useState<string | null>(null)

  const capabilities = getMatchActionCapabilities(match?.status)
  const isFinished = capabilities.canGenerateScoresheet

  const loadScoresheet = useCallback(async () => {
    if (!matchId) return
    setScoresheetState('loading')
    setError(null)
    try {
      const payload = await ScoresheetGateway.fetch(matchId)
      setScoresheet(payload)
      setScoresheetState('success')
    } catch (err) {
      console.error(`Failed to preview scoresheet for match ${matchId}`, err)
      setScoresheet(null)
      setScoresheetState('error')
      setError(resolveMatchActionError(err, 'Não foi possível carregar a pré-visualização da súmula.'))
    }
  }, [matchId])

  useEffect(() => {
    let active = true

    async function loadMatch() {
      if (!matchId) return
      setMatchState('loading')
      setError(null)
      try {
        const detail = await MatchesGateway.getById(matchId)
        if (!active) return
        setMatch(detail)
        setMatchState('success')
        if (getMatchActionCapabilities(detail.status).canGenerateScoresheet) {
          await loadScoresheet()
        } else {
          setScoresheet(null)
          setScoresheetState('idle')
        }
      } catch (err) {
        if (!active) return
        console.error(`Failed to load match ${matchId}`, err)
        setMatchState('error')
        setError(resolveMatchActionError(err, 'Não foi possível carregar os dados da partida.'))
      }
    }

    loadMatch()

    return () => {
      active = false
    }
  }, [loadScoresheet, matchId])

  const previewUrl = useMemo(() => {
    if (!scoresheet?.base64) return null
    const blob = base64ToBlob(scoresheet.base64, scoresheet.mime || 'application/pdf')
    return URL.createObjectURL(blob)
  }, [scoresheet])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleDownload = async () => {
    setDownloadLoading(true)
    setError(null)
    try {
      const payload = await ScoresheetGateway.fetch(matchId)
      downloadBase64File(payload.base64, payload.filename, payload.mime)
    } catch (err) {
      console.error(`Failed to download scoresheet for match ${matchId}`, err)
      setError(resolveMatchActionError(err, 'Não foi possível baixar a súmula da partida.'))
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleSignaturePlaceholder = () => {
    setSignatureMessage('Integração de assinatura digital será habilitada na próxima etapa.')
  }

  const matchTitle = match ? `${match.homeTeam.name} ${match.homeTeam.score} x ${match.awayTeam.score} ${match.awayTeam.name}` : 'Partida'
  const startAtLabel = formatStartAt(match?.startAt)
  const statusLabel = formatMatchStatusLabel(match?.status)

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
      <PageWrapper
        title="Súmula da partida"
        description="Pré-visualização da súmula oficial gerada pelo backend."
        actions={
          <Button type="button" variant="secondary" onClick={() => router.push('/matches')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      >
        <div className="space-y-4">
          {error && <AlertBanner variant="error" message={error} />}
          {signatureMessage && <AlertBanner variant="info" message={signatureMessage} />}
          {matchState === 'loading' && <AlertBanner variant="info" message="Carregando dados da partida..." />}
          {match && !isFinished && (
            <AlertBanner
              variant="warning"
              message="A súmula só pode ser visualizada para partidas finalizadas."
            />
          )}
        </div>

        <section className="grid gap-4 rounded-xl border border-borderSoft bg-surface-elevated p-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoBlock label="Partida" value={matchState === 'loading' ? 'Carregando...' : matchTitle} />
          <InfoBlock label="Competição" value={match?.competitionName || 'Competição não informada'} />
          <InfoBlock label="Data" value={startAtLabel} />
          <InfoBlock label="Status" value={statusLabel} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-xl border border-borderSoft bg-surface-elevated">
            <div className="flex min-h-[560px] items-center justify-center bg-surface-muted">
              {matchState === 'loading' && scoresheetState === 'idle' && (
                <div className="flex flex-col items-center gap-3 text-sm text-textSecondary">
                  <Loader2 className="h-7 w-7 animate-spin" />
                  Carregando dados da partida...
                </div>
              )}

              {scoresheetState === 'loading' && (
                <div className="flex flex-col items-center gap-3 text-sm text-textSecondary">
                  <Loader2 className="h-7 w-7 animate-spin" />
                  Gerando pré-visualização da súmula...
                </div>
              )}

              {scoresheetState === 'success' && previewUrl && scoresheet?.mime === 'application/pdf' && (
                <iframe
                  title="Pré-visualização da súmula"
                  src={previewUrl}
                  className="h-[72vh] min-h-[560px] w-full bg-white"
                />
              )}

              {scoresheetState === 'success' && previewUrl && scoresheet?.mime !== 'application/pdf' && (
                <object
                  data={previewUrl}
                  type={scoresheet?.mime || 'application/octet-stream'}
                  className="h-[72vh] min-h-[560px] w-full bg-white"
                >
                  <div className="p-6 text-center text-sm text-textSecondary">
                    Pré-visualização indisponível para este formato.
                  </div>
                </object>
              )}

              {scoresheetState === 'error' && (
                <div className="flex flex-col items-center gap-3 px-6 text-center text-sm text-textSecondary">
                  <FileText className="h-8 w-8" />
                  Não foi possível carregar o preview.
                </div>
              )}

              {matchState !== 'loading' && scoresheetState === 'idle' && !isFinished && (
                <div className="flex flex-col items-center gap-3 px-6 text-center text-sm text-textSecondary">
                  <FileText className="h-8 w-8" />
                  Preview indisponível para o status atual da partida.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-borderSoft bg-surface-elevated p-4">
              <h3 className="text-base font-semibold text-textPrimary">Ações</h3>
              <div className="mt-4 space-y-3">
                <Button
                  type="button"
                  className="w-full gap-2"
                  onClick={handleDownload}
                  disabled={!isFinished || downloadLoading}
                >
                  {downloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Baixar súmula
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2"
                  onClick={handleSignaturePlaceholder}
                  disabled={!isFinished}
                >
                  <Send className="h-4 w-4" />
                  Enviar para assinatura
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-borderSoft bg-surface-elevated p-4">
              <h3 className="text-base font-semibold text-textPrimary">Assinatura digital</h3>
              <div className="mt-4 space-y-3">
                <input className="field-control" value="Processo ativo: não consultado nesta etapa" readOnly />
                <input className="field-control" value="Signatários extras serão configurados aqui" readOnly />
              </div>
            </div>
          </aside>
        </section>
      </PageWrapper>
    </DashboardShell>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-textSecondary">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-textPrimary">{value}</p>
    </div>
  )
}

function formatStartAt(value?: string): string {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = window.atob(base64)
  const chunks: ArrayBuffer[] = []
  const chunkSize = 1024

  for (let offset = 0; offset < binary.length; offset += chunkSize) {
    const slice = binary.slice(offset, offset + chunkSize)
    const bytes = new Uint8Array(slice.length)
    for (let index = 0; index < slice.length; index += 1) {
      bytes[index] = slice.charCodeAt(index)
    }
    chunks.push(bytes.buffer.slice(0))
  }

  return new Blob(chunks, { type: mime })
}
