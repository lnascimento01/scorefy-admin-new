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

export function SidebarItem({ label, icon: Icon, href, active = false, onClick }: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition',
        active
          ? 'bg-red-primary text-white shadow-sm dark:bg-dark-red-primary'
          : 'text-textPrimary hover:bg-surface-muted dark:text-dark-text dark:hover:bg-dark-surface2',
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}
