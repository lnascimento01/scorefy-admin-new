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
        'group flex items-center gap-3 rounded-apple border px-3 py-2.5 text-sm font-medium transition',
        active
          ? 'border-borderSoft bg-card text-accent shadow-card dark:border-dark-border dark:bg-dark-surface2 dark:text-accent'
          : 'border-transparent text-[#0A0A0A] hover:border-borderSoft hover:bg-card hover:text-accent dark:text-white dark:hover:border-dark-border dark:hover:bg-dark-surface2 dark:hover:text-accent',
      )}
    >
      <Icon
        size={18}
        className={cn(
          'transition',
          active ? 'text-accent' : 'text-[#0A0A0A] group-hover:text-accent dark:text-white dark:group-hover:text-accent',
        )}
      />
      <span className="leading-none">{label}</span>
    </Link>
  )
}
