'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SidebarItemProps {
  label: string
  icon: LucideIcon
  href: string
  active?: boolean
  onClick?: () => void
}

export function SidebarItem({
  label,
  icon: Icon,
  href,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'app-nav-link group relative flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-[0.94rem] transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-1)]',
        active
          ? [
              'bg-[color:var(--brand-soft)]',
              'text-[color:var(--text-1)]',
              'border border-[color:var(--brand-soft-border)]',
              'shadow-[0_1px_0_rgba(255,255,255,0.04)]',
            ].join(' ')
          : [
              'text-[color:var(--text-3)]',
              'hover:bg-[color:var(--surface-2)]',
              'hover:text-[color:var(--text-2)]',
            ].join(' ')
      )}
    >
      {/* Icon tile */}
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-md border transition',
          active
            ? 'bg-[color:rgba(79,140,255,0.14)] border-[color:rgba(79,140,255,0.22)]'
            : 'bg-[color:rgba(255,255,255,0.04)] border-[color:rgba(160,190,255,0.08)] group-hover:bg-[color:rgba(255,255,255,0.06)]'
        )}
      >
        <Icon
          size={18}
          className={cn(
            'transition-colors',
            active ? 'text-[color:var(--brand)]' : 'text-[color:var(--text-3)] group-hover:text-[color:var(--text-2)]'
          )}
        />
      </span>

      <span
        className={cn(
          'truncate leading-none',
          active
            ? 'font-semibold text-[color:var(--text-1)]'
            : 'font-medium text-[color:var(--text-3)] group-hover:text-[color:var(--text-2)]',
        )}
      >
        {label}
      </span>

      {/* Optional: subtle chevron-on-hover (gives “menu feel”) */}
      <span
        className={cn(
          'ml-auto text-[color:var(--text-4)] opacity-0 transition',
          'group-hover:opacity-100'
        )}
      >
        ›
      </span>

      {/* Optional: active glow (very subtle) */}
      {active && (
        <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[0_0_0_1px_rgba(79,140,255,0.10),0_10px_24px_rgba(0,0,0,0.25)]" />
      )}
    </Link>
  )
}
