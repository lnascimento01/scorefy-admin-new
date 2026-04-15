import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type AlertBannerVariant = 'info' | 'success' | 'warning' | 'error'

const variantConfig: Record<AlertBannerVariant, { className: string; icon: LucideIcon }> = {
  info: {
    className: 'border-transparent bg-[rgba(87,181,255,0.14)] text-info',
    icon: Info
  },
  success: {
    className: 'border-transparent bg-[rgba(43,228,167,0.14)] text-success',
    icon: CheckCircle2
  },
  warning: {
    className: 'border-transparent bg-[rgba(255,194,74,0.14)] text-warning',
    icon: AlertTriangle
  },
  error: {
    className: 'border-transparent bg-[rgba(255,91,110,0.14)] text-danger',
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
