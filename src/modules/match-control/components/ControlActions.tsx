'use client'

import type { MatchControlAction } from '../hooks/useMatchActions'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'
import { Flag, PauseCircle, PlayCircle, RotateCcw, Timer, Octagon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useEffect, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button as UiButton } from '@/components/ui/button'

interface ControlActionsProps {
  statusLabel: string
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canFinish: boolean
  canFinishPeriod: boolean
  canCancel: boolean
  loadingAction: MatchControlAction | null
  onAction: (action: MatchControlAction, payload?: { reason?: string }) => void
  lastSync?: string | null
  isFinalStatus?: boolean
}

export function ControlActions({
  statusLabel,
  canStart,
  canPause,
  canResume,
  canFinish,
  canFinishPeriod,
  canCancel,
  loadingAction,
  onAction,
  lastSync,
  isFinalStatus = false
}: ControlActionsProps) {
  const { dictionary, language } = useI18n()
  const copy = dictionary.matchControl.controls
  const [resumePrompt, setResumePrompt] = useState<'default' | 'final' | null>(null)
  const [pausePrompt, setPausePrompt] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseError, setPauseError] = useState<string | null>(null)

  const handleAction = (action: MatchControlAction) => {
    if (action === 'resume') {
      setResumePrompt(isFinalStatus ? 'final' : 'default')
      return
    }
    if (action === 'pause') {
      setPauseReason('')
      setPauseError(null)
      setPausePrompt(true)
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
    loadingLabel: string
    icon: LucideIcon
    variant: 'primary' | 'secondary' | 'outline' | 'ghost'
    highlight?: string
    enabled: boolean
  }> = [
    {
      action: 'start',
      label: copy.buttons.start,
      loadingLabel: copy.buttons.starting,
      icon: PlayCircle,
      variant: 'primary',
      enabled: canStart
    },
    {
      action: 'resume',
      label: copy.buttons.resume,
      loadingLabel: copy.buttons.resuming,
      icon: RotateCcw,
      variant: 'secondary',
      highlight: 'text-secondary',
      enabled: canResume
    },
    {
      action: 'pause',
      label: copy.buttons.pause,
      loadingLabel: copy.buttons.pausing,
      icon: PauseCircle,
      variant: 'secondary',
      highlight: 'text-amber-200',
      enabled: canPause
    },
    {
      action: 'finish',
      label: copy.buttons.finish,
      loadingLabel: copy.buttons.finishing,
      icon: Flag,
      variant: 'outline',
      highlight: 'text-primary',
      enabled: canFinish
    },
    {
      action: 'finishPeriod',
      label: copy.buttons.finishPeriod,
      loadingLabel: copy.buttons.finishingPeriod,
      icon: Timer,
      variant: 'outline',
      highlight: 'text-sky-300',
      enabled: canFinishPeriod
    },
    {
      action: 'cancel',
      label: copy.buttons.cancel,
      loadingLabel: copy.buttons.canceling,
      icon: Octagon,
      variant: 'outline',
      highlight: 'text-primary',
      enabled: canCancel
    }
  ]
  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-textSecondary">{copy.title}</p>
          <p className="text-xl font-semibold text-textPrimary">{copy.subtitle}</p>
        </div>
        <p className="text-xs text-textSecondary">
          {copy.lastSync}: {formatTimestamp(lastSync, language)}
        </p>
      </div>
      {resumePrompt && (
        <ResumeConfirmModal
          title={resumePrompt === 'final' ? copy.resumeFinalConfirm : copy.resumeConfirm}
          description={resumePrompt === 'final' ? copy.resumeFinalDescription : copy.resumeDescription}
          confirmLabel={copy.buttons.resume}
          cancelLabel={dictionary.actions.cancel ?? 'Cancelar'}
          onConfirm={() => {
            setResumePrompt(null)
            onAction('resume')
          }}
          onCancel={() => setResumePrompt(null)}
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
      <div className="flex flex-wrap gap-2">
        {buttons.map(({ action, label, loadingLabel, icon: Icon, variant, highlight, enabled }) => (
          <Button
            key={action}
            variant={variant}
            size="sm"
            onClick={() => handleAction(action)}
            disabled={!enabled || loadingAction !== null}
            className={cn(
              'flex-1 min-w-[140px] justify-center gap-2 rounded-lg border border-borderSoft/40 bg-[var(--surface-muted)] text-sm font-semibold text-textPrimary',
              variant === 'primary' && 'border-transparent bg-primary text-onPrimary hover:bg-primary/90',
              variant === 'secondary' && 'border-transparent bg-secondary/15 text-secondary hover:bg-secondary/25',
              variant === 'outline' && 'bg-transparent hover:border-borderStrong',
              highlight
            )}
          >
            <Icon className="h-4 w-4" />
            {loadingAction === action ? loadingLabel : label}
          </Button>
        ))}
      </div>
      <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-textSecondary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {copy.statusLabel}:{' '}
            <span className="font-semibold text-textPrimary">{statusLabel}</span>
          </span>
          <span className="text-xs text-textSecondary opacity-80">
            {copy.nextPeriod} • {copy.finishPeriod}
          </span>
        </div>
      </div>
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

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
