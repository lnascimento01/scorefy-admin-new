import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto rounded-2xl border border-borderSofter bg-surface-contrast shadow-card">
    <table
      ref={ref}
      className={cn('w-full min-w-[640px] divide-y divide-borderSofter text-left text-sm text-textPrimary', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        'bg-surface-elevated text-xs font-semibold uppercase tracking-wide text-textMuted',
        className,
      )}
      {...props}
    />
  ),
)
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-borderSofter', className)} {...props} />
  ),
)
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition hover:bg-surface-elevated',
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-textMuted', className)}
      {...props}
    />
  ),
)
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-4 align-middle text-sm text-textPrimary', className)} {...props} />
  ),
)
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('px-4 py-4 text-left text-sm text-textSecondary', className)} {...props} />
  ),
)
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption }
