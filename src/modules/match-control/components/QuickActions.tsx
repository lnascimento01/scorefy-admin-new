'use client'

import { motion } from 'framer-motion'
import type { MatchQuickAction } from '../types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n'

interface QuickActionsProps {
  actions: MatchQuickAction[]
  onTrigger: (action: MatchQuickAction) => void
  disabled?: boolean
  variant?: 'default' | 'compact'
}

export function QuickActions({ actions, onTrigger, disabled, variant = 'default' }: QuickActionsProps) {
  const { dictionary } = useI18n()
  const copy = dictionary.matchControl.quickActions
  const isCompact = variant === 'compact'
  return (
    <section className={cn('card p-3', !isCompact && 'p-4')}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-textSecondary">{copy.title}</h2>
      </div>
      <div className={cn('grid gap-2 grid-cols-2 xl:grid-cols-4', isCompact && 'xl:grid-cols-4')}>
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                title={action.description ?? action.label}
                aria-label={action.description ?? action.label}
                onClick={() => onTrigger(action)}
                className={cn(
                  'w-full justify-start gap-2 rounded-lg border text-left text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60',
                  isCompact ? 'min-h-9 px-3 py-2' : 'min-h-10 px-3 py-2.5',
                  toneClass(action.tone)
                )}
              >
                {Icon && <Icon className={cn(isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
                <span className="truncate whitespace-nowrap">
                  {action.shortLabel ?? action.label}
                </span>
              </Button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function toneClass(tone: MatchQuickAction['tone']): string {
  switch (tone) {
    case 'danger':
      return 'border-transparent bg-rose-600 text-white hover:bg-rose-500'
    case 'info':
      return 'border-transparent bg-sky-600 text-white hover:bg-sky-500'
    case 'primary':
      return 'border-transparent bg-primary text-onPrimary hover:bg-primary/90'
    default:
      return 'border-borderSoft bg-surface-muted text-textPrimary hover:bg-surface-muted/80'
  }
}
