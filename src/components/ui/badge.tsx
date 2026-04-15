import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva('inline-flex min-w-[96px] items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition', {
  variants: {
    variant: {
      default: 'border-transparent bg-[rgba(255,255,255,0.06)] text-textSecondary',
      success: 'border-transparent bg-[rgba(43,228,167,0.14)] text-success',
      warning: 'border-transparent bg-[rgba(255,194,74,0.14)] text-warning',
      info: 'border-transparent bg-[rgba(87,181,255,0.14)] text-info',
      danger: 'border-transparent bg-[rgba(255,91,110,0.14)] text-danger'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
