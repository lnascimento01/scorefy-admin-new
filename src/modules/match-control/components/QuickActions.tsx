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
    <section className={cn('card p-6', isCompact && 'p-4')}>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-textPrimary">{copy.title}</h2>
        <p className="text-sm text-textSecondary">{copy.description}</p>
      </div>
      <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', isCompact && 'xl:grid-cols-3')}>
        {actions.map((action, index) => {
          const Icon = action.icon
          const descriptionClass =
            action.tone && action.tone !== 'neutral'
              ? 'text-xs text-white/80'
              : 'text-xs text-textSecondary'
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
                onClick={() => onTrigger(action)}
                className={cn(
                  'w-full flex-col rounded-xl border text-center text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60',
                  isCompact ? 'h-28 px-3 py-4 text-sm' : 'h-32 px-4 py-6',
                  toneClass(action.tone)
                )}
              >
                {Icon && <Icon className={cn(isCompact ? 'h-5 w-5' : 'h-6 w-6')} />}
                <span className={cn('font-semibold p-2', isCompact ? 'text-sm' : 'text-base')}>
                  {action.label}
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
