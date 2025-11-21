'use client'

interface FullScreenMessageProps {
  title: string
  description?: string
}

export function FullScreenMessage({ title, description }: FullScreenMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-textPrimary">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-borderSoft bg-[var(--surface-elevated)] px-8 py-10 text-center shadow-card">
        <span className="inline-flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-borderSoft border-t-primary" />
        <h2 className="text-base font-semibold text-textPrimary">{title}</h2>
        {description && <p className="text-sm text-textSecondary">{description}</p>}
      </div>
    </div>
  )
}
