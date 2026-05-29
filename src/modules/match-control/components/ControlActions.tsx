'use client'

import type { MatchControlAction } from '../hooks/useMatchActions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Flag, PauseCircle, PlayCircle, RotateCcw, Timer, Octagon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button as UiButton } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ConfirmModal'

interface ControlActionsProps {
  statusLabel: string
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canFinish: boolean
  canStartNextPeriod: boolean
  canCancel: boolean
  loadingAction: MatchControlAction | null
  onAction: (action: MatchControlAction, payload?: { reason?: string }) => void
  lastSync?: string | null
  isTerminal?: boolean
  disabled?: boolean
}

export function ControlActions({
  statusLabel,
  canStart,
  canPause,
  canResume,
  canFinish,
  canStartNextPeriod,
  canCancel,
  loadingAction,
  onAction,
  lastSync,
  isTerminal = false,
  disabled = false
}: ControlActionsProps) {
  const { dictionary, language } = useI18n()
  const copy = dictionary.matchControl.controls
  const [resumePrompt, setResumePrompt] = useState(false)
  const [pausePrompt, setPausePrompt] = useState(false)
  const [cancelPrompt, setCancelPrompt] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseError, setPauseError] = useState<string | null>(null)

  const handleAction = (action: MatchControlAction) => {
    if (disabled) return
    if (action === 'resume') {
      setResumePrompt(true)
      return
    }
    if (action === 'pause') {
      setPauseReason('')
      setPauseError(null)
      setPausePrompt(true)
      return
    }
    if (action === 'cancel') {
      setCancelPrompt(true)
      return
    }
    onAction(action)
  }

  const confirmPause = () => {
    const trimmed = pauseReason.trim()
    if (!trimmed) {
      setPauseError(copy.pauseReasonError)
      return
    }
    setPausePrompt(false)
    onAction('pause', { reason: trimmed })
  }
  const buttons: Array<{
    action: MatchControlAction
    label: string
    shortLabel: string
    loadingLabel: string
    icon: LucideIcon
    variant: 'primary' | 'secondary' | 'outline' | 'ghost'
    highlight?: string
    enabled: boolean
  }> = [
    {
      action: 'start',
      label: copy.buttons.start,
      shortLabel: copy.buttons.start,
      loadingLabel: copy.buttons.starting,
      icon: PlayCircle,
      variant: 'primary',
      enabled: canStart
    },
    {
      action: 'resume',
      label: copy.buttons.resume,
      shortLabel: copy.buttons.resume,
      loadingLabel: copy.buttons.resuming,
      icon: RotateCcw,
      variant: 'secondary',
      highlight: 'text-secondary',
      enabled: canResume
    },
    {
      action: 'pause',
      label: copy.buttons.pause,
      shortLabel: copy.buttons.pause,
      loadingLabel: copy.buttons.pausing,
      icon: PauseCircle,
      variant: 'secondary',
      highlight: 'text-amber-200',
      enabled: canPause
    },
    {
      action: 'finish',
      label: copy.buttons.finish,
      shortLabel: 'Encerrar',
      loadingLabel: copy.buttons.finishing,
      icon: Flag,
      variant: 'outline',
      highlight: 'text-primary',
      enabled: canFinish
    },
    {
      action: 'startNextPeriod',
      label: copy.buttons.startNextPeriod,
      shortLabel: 'Próximo período',
      loadingLabel: copy.buttons.startingNextPeriod,
      icon: Timer,
      variant: 'secondary',
      highlight: 'text-sky-300',
      enabled: canStartNextPeriod
    },
    {
      action: 'cancel',
      label: copy.buttons.cancel,
      shortLabel: 'Cancelar',
      loadingLabel: copy.buttons.canceling,
      icon: Octagon,
      variant: 'danger',
      highlight: '',
      enabled: canCancel
    }
  ]
  const enabledButtons = buttons.filter(({ enabled }) => enabled)
  return (
    <section className="card space-y-2.5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-textSecondary">{copy.title}</p>
        <p className="shrink-0 text-[10px] text-textSecondary">
          {copy.lastSync}: {formatTimestamp(lastSync, language)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-textSecondary">
        <span className="rounded-full border border-borderSoft/60 bg-surface px-2 py-0.5 font-semibold text-textPrimary">
          {copy.statusLabel}: {statusLabel}
        </span>
        {canStartNextPeriod && (
          <span className="opacity-80">
            {copy.nextPeriod}: {copy.startNextPeriod}
          </span>
        )}
      </div>
      {isTerminal && (
        <div className="rounded-lg border border-borderSoft/60 bg-surface-muted px-3 py-2 text-xs text-textSecondary">
          Partida finalizada ou cancelada. As ações operacionais ficam bloqueadas.
        </div>
      )}
      {resumePrompt && (
        <ResumeConfirmModal
          title={copy.resumeConfirm}
          description={copy.resumeDescription}
          confirmLabel={copy.buttons.resume}
          cancelLabel={dictionary.actions.cancel ?? 'Cancelar'}
          onConfirm={() => {
            setResumePrompt(false)
            onAction('resume')
          }}
          onCancel={() => setResumePrompt(false)}
        />
      )}
      {pausePrompt && (
        <PauseReasonModal
          title={copy.pauseReasonTitle}
          description={copy.pauseReasonDescription}
          placeholder={copy.pauseReasonPlaceholder}
          confirmLabel={copy.pauseReasonConfirm}
          cancelLabel={dictionary.actions.cancel ?? 'Cancelar'}
          value={pauseReason}
          error={pauseError}
          onChange={(event) => {
            setPauseReason(event.target.value)
            if (pauseError) setPauseError(null)
          }}
          onConfirm={confirmPause}
          onCancel={() => setPausePrompt(false)}
        />
      )}
      {cancelPrompt && (
        <ConfirmModal
          open
          title={copy.buttons.cancel}
          description="Cancelar esta partida? Esta ação não poderá ser desfeita."
          confirmLabel={copy.buttons.cancel}
          cancelLabel={dictionary.actions.cancel ?? 'Cancelar'}
          onCancel={() => setCancelPrompt(false)}
          onConfirm={() => {
            setCancelPrompt(false)
            onAction('cancel')
          }}
        />
      )}
      {enabledButtons.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {enabledButtons.map(({ action, label, shortLabel, loadingLabel, icon: Icon, variant, highlight }) => (
            <Button
              key={action}
              variant={variant}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={loadingAction !== null || disabled}
              title={label}
              aria-label={label}
              className={cn(
                'h-9 w-full justify-start gap-2 rounded-lg px-3 text-xs font-semibold leading-none whitespace-nowrap',
                variant === 'primary' && 'border-transparent bg-primary text-onPrimary hover:bg-primary/90',
                variant === 'secondary' && 'border border-borderSoft/40 bg-[var(--surface-muted)] text-secondary hover:bg-secondary/25 hover:text-textPrimary',
                variant === 'outline' && 'border border-borderSoft/40 bg-transparent text-textPrimary hover:border-borderStrong',
                variant === 'ghost' && 'border border-transparent bg-transparent text-textSecondary hover:bg-[rgba(255,255,255,0.06)] hover:text-textPrimary',
                variant === 'danger' && 'border border-[rgba(255,91,110,0.25)] bg-[rgba(255,91,110,0.16)] text-danger hover:bg-[rgba(255,91,110,0.22)]',
                highlight
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {loadingAction === action ? loadingLabel : shortLabel}
              </span>
            </Button>
          ))}
        </div>
      )}
    </section>
  )
}

const localeMap: Record<Language, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

function formatTimestamp(timestamp?: string | null, language: Language = 'pt'): string {
  if (!timestamp) return '—'
  try {
    return new Date(timestamp).toLocaleString(localeMap[language] ?? 'pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  } catch {
    return '—'
  }
}

function ResumeConfirmModal({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: {
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] p-6 text-textPrimary shadow-2xl">
        <div className="space-y-3">
          <div>
            <p className="text-lg font-semibold">{title}</p>
            {description && <p className="text-sm text-textSecondary">{description}</p>}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <UiButton type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </UiButton>
            <UiButton type="button" onClick={onConfirm}>
              {confirmLabel}
            </UiButton>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PauseReasonModal({
  title,
  description,
  placeholder,
  confirmLabel,
  cancelLabel,
  value,
  error,
  onChange,
  onConfirm,
  onCancel
}: {
  title: string
  description?: string
  placeholder?: string
  confirmLabel: string
  cancelLabel: string
  value: string
  error: string | null
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md space-y-3 rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] p-6 text-textPrimary shadow-2xl">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          {description && <p className="text-sm text-textSecondary">{description}</p>}
        </div>
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={onChange}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-xl border border-borderSoft bg-surface-muted px-4 py-2 text-sm text-textPrimary focus:border-secondary focus:outline-none"
          />
          {error && <p className="text-xs text-primary">{error}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <UiButton type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </UiButton>
          <UiButton type="button" onClick={onConfirm}>
            {confirmLabel}
          </UiButton>
        </div>
      </div>
    </div>,
    document.body
  )
}
