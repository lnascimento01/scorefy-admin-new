'use client'

import { usePathname } from 'next/navigation'
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Radio,
  Trophy,
  Users,
  Users2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { PageContainer } from '@/components/ui/PageContainer'
import { SettingsPanel } from '@/components/layout/SettingsPanel'

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
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  return (
    <div className="flex min-h-screen bg-surface text-textPrimary">
      <div className="hidden min-h-screen w-64 shrink-0 lg:block lg:sticky lg:top-0 lg:h-screen">
        <Sidebar
          items={navItems}
          activePath={pathname}
          footer={
            <div className="space-y-1 rounded-lg bg-surface-muted p-3 dark:bg-dark-surface2">
              <p className="text-sm font-semibold text-textPrimary dark:text-dark-text">Painel Scorefy</p>
              <p>Controle partidas, súmulas e usuários com segurança.</p>
            </div>
          }
        />
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          role="presentation"
        >
          <div className="h-full w-72 bg-surface-contrast p-4 dark:bg-dark-surface" onClick={(event) => event.stopPropagation()}>
            <Sidebar items={navItems} activePath={pathname} onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-6 bg-surface py-4">
        <PageContainer className="space-y-6">
          <TopNav
            title={dictionary.header.welcome}
            subtitle={userName}
            onMenuToggle={() => setMenuOpen(true)}
            onRefresh={onRefresh}
            refreshing={refreshing}
            userName={userName}
            userEmail={userEmail}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <div className="flex-1 space-y-6 pb-8">{children}</div>
        </PageContainer>
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
