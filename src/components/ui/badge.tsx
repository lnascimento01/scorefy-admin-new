import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva('inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition min-w-[96px]', {
  variants: {
    variant: {
      default: 'border-borderSoft bg-surface-muted text-textPrimary dark:border-dark-border dark:bg-dark-surface2 dark:text-dark-text',
      success: 'border-[color:rgba(61,214,140,0.45)] bg-[rgba(61,214,140,0.18)] text-[#3DD68C]',
      warning: 'border-[color:rgba(234,170,8,0.45)] bg-[rgba(234,170,8,0.18)] text-[#EAAA08]',
      info: 'border-[color:rgba(29,78,216,0.4)] bg-[rgba(29,78,216,0.16)] text-[#1D4ED8]',
      danger: 'border-[color:rgba(229,37,52,0.45)] bg-[rgba(229,37,52,0.2)] text-[#E52534]'
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
