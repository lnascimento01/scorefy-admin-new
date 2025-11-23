import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type AlertBannerVariant = 'info' | 'success' | 'warning' | 'error'

const variantConfig: Record<AlertBannerVariant, { className: string; icon: LucideIcon }> = {
  info: {
    className: 'border-accent/30 bg-accent/10 text-accent',
    icon: Info
  },
  success: {
    className: 'border-success/30 bg-success/10 text-success',
    icon: CheckCircle2
  },
  warning: {
    className: 'border-warning/30 bg-warning/10 text-warning',
    icon: AlertTriangle
  },
  error: {
    className: 'border-red-primary/40 bg-red-primary/10 text-red-primary dark:border-dark-red-primary/50 dark:bg-dark-red-primary/15 dark:text-dark-red-primary',
    icon: XCircle
  }
}

interface AlertBannerProps {
  variant?: AlertBannerVariant
  title?: string
  message?: string
  className?: string
  children?: ReactNode
}

export function AlertBanner({ variant = 'info', title, message, className, children }: AlertBannerProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', config.className, className)}>
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-semibold leading-tight">{title}</p>}
        {message && <p className="leading-snug">{message}</p>}
        {children}
      </div>
    </div>
  )
}
