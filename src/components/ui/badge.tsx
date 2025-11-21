import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', {
  variants: {
    variant: {
      default: 'border-borderSoft bg-surface-muted text-textPrimary',
      success: 'border-transparent bg-emerald-500/15 text-emerald-300',
      warning: 'border-transparent bg-amber-500/20 text-amber-300',
      info: 'border-transparent bg-sky-500/20 text-sky-300'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
