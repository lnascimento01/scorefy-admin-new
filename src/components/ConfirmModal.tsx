'use client'

import { ReactNode } from 'react'
import { Button } from './ui/button'

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  footer?: ReactNode
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  footer
}: ConfirmModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-borderSoft bg-[var(--surface-elevated)] p-6 shadow-xl">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-textPrimary">{title}</h3>
          {description && <p className="text-sm text-textSecondary">{description}</p>}
        </div>
        {footer && <div className="mt-3 text-xs text-textSecondary">{footer}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
