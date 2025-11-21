'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  RefreshCcw,
  Search,
  Settings2,
  Trophy,
  Users,
  Users2,
  X
} from 'lucide-react'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/lib/i18n'
import { useMemo, useState } from 'react'

interface DashboardShellProps {
  userName: string
  userEmail?: string
  onRefresh?: () => void
  refreshing?: boolean
  children: React.ReactNode
}

export function DashboardShell({ userName, userEmail, onRefresh, refreshing, children }: DashboardShellProps) {
  const pathname = usePathname()
  const { dictionary } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = useMemo(
    () => [
      { key: 'dashboard', href: '/', label: dictionary.navigation.dashboard, Icon: LayoutDashboard },
      { key: 'matches', href: '/matches', label: dictionary.navigation.matches, Icon: Radio },
      { key: 'competitions', href: '/competitions', label: dictionary.navigation.competitions, Icon: Trophy },
      { key: 'teams', href: '/teams', label: dictionary.navigation.teams, Icon: Users2 },
      { key: 'stats', href: '/stats', label: dictionary.navigation.stats, Icon: BarChart3 },
      { key: 'reports', href: '/reports', label: dictionary.navigation.reports, Icon: FileText },
      { key: 'users', href: '/users', label: dictionary.navigation.users, Icon: Users }
    ],
    [dictionary.navigation],
  )

  const initials = useMemo(() => {
    return userName
      .split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }, [userName])

  const sidebar = (
    <aside className="sidebar-panel flex h-full flex-col gap-6 rounded-3xl p-6 text-textSecondary">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-textSecondary">Scorify</p>
          <p className="text-lg font-semibold text-textPrimary">Admin</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-borderSoft bg-surface text-textPrimary lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-surface-muted text-textPrimary'
                  : 'text-textSecondary hover:bg-surface-muted hover:text-textPrimary'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="inline-flex items-center gap-3">
                <item.Icon className="h-4 w-4" />
                {item.label}
              </span>
              {isActive && <span className="text-xs text-primary">●</span>}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] p-4 text-xs text-textSecondary">
        <p className="font-semibold text-textPrimary">Controle total do campeonato</p>
        <p>Monitore partidas, súmulas e usuários com segurança.</p>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-surface text-textPrimary">
      <div className="hidden min-h-screen w-64 lg:block">{sidebar}</div>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="max-w-xs" onClick={(event) => event.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}
      <div className="flex w-full flex-col gap-6 p-4 lg:p-8">
        <header className="header-panel rounded-3xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-textSecondary">{dictionary.header.welcome}</p>
              <p className="text-2xl font-semibold text-textPrimary">{userName}</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher size="sm" />
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-borderSoft bg-surface px-4 py-2 text-sm font-medium text-textPrimary transition hover:border-borderStrong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{dictionary.header.refresh}</span>
                </button>
              )}
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-borderSoft bg-surface text-textPrimary lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary" />
              <input
                type="search"
                placeholder="Buscar partidas, atletas ou usuários"
                className="w-full rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] py-2.5 pl-11 pr-4 text-sm text-textPrimary placeholder-textPlaceholder focus:border-secondary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              {[Bell, Settings2, LogOut].map((Icon, index) => (
                <button
                  key={Icon.displayName ?? index}
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] text-textPrimary"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-[var(--surface-elevated-strong)] px-4 py-2">
              <div className="text-right">
                <p className="text-sm font-semibold text-textPrimary">{userName}</p>
                {userEmail && <p className="text-xs text-textSecondary">{userEmail}</p>}
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 text-sm font-semibold text-secondary">
                {initials}
              </span>
            </div>
          </div>
        </header>
        <main className="page-container flex-1 space-y-6">{children}</main>
      </div>
    </div>
  )
}
