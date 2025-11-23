'use client'

import { useMemo } from 'react'
import { Filter, Mail, RefreshCcw, ShieldCheck, SortAsc, UserRound } from 'lucide-react'
import { DashboardShell } from '@/modules/dashboard/components/DashboardShell'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { AlertBanner } from '@/components/AlertBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationControls } from '@/components/PaginationControls'
import type { AuthProfile } from '@/services/auth.service'
import { useUsers } from '../hooks/useUsers'

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UsersPage({ currentUser }: { currentUser: AuthProfile }) {
  const { users, meta, filters, loading, error, source, setSearch, setSort, setPage, setPerPage, refetch } = useUsers()
  const perPageOptions = [10, 20, 30, 50]

  const sortOptions = useMemo(
    () => [
      { value: 'name' as const, label: 'Nome (A-Z)' },
      { value: '-name' as const, label: 'Nome (Z-A)' },
      { value: 'email' as const, label: 'Email (A-Z)' },
      { value: '-email' as const, label: 'Email (Z-A)' },
      { value: 'created_at' as const, label: 'Criado (mais antigo)' },
      { value: '-created_at' as const, label: 'Criado (mais recente)' }
    ],
    [],
  )

  return (
    <DashboardShell userName={currentUser.name} userEmail={currentUser.email}>
      <PageWrapper
        title="Usuários (master admin)"
        description="Lista de contas com acesso ao Scorefy. Requer token de master admin."
        actions={
          <Button variant="outline" className="flex items-center gap-2" onClick={refetch} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            {loading ? 'Sincronizando...' : 'Atualizar'}
          </Button>
        }
      >
        <div className="space-y-2">
          {error && <AlertBanner variant="warning" message={error} />}
          <AlertBanner variant="info" message={`Fonte: ${source === 'api' ? 'API' : 'dataset'}. Endpoint: /api/v1/auth/users`} />
        </div>

        <section className="card space-y-6 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-textSecondary">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Buscar</span>
              <Input
                placeholder="Nome ou email"
                value={filters.q ?? ''}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Ordenação</span>
              <div className="flex gap-2">
                <Select
                  value={filters.sort}
                  onChange={(event) => setSort(event.target.value as typeof filters.sort)}
                  className="flex-1"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-borderSoft bg-surface-muted text-textSecondary dark:border-dark-border dark:bg-dark-surface2">
                  <SortAsc className="h-4 w-4" />
                </span>
              </div>
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-textSecondary">Por página</span>
              <Select
                value={filters.perPage ?? 30}
                onChange={(event) => setPerPage(Number(event.target.value))}
              >
                {perPageOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="rounded-2xl border border-borderSoft">
            <div className="flex items-center justify-between border-b border-borderSoft px-4 py-3 text-sm text-textSecondary">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {`Exibindo ${users.length} de ${meta.total || users.length} usuários`}
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-textSecondary">
                {source === 'api' ? 'Backend' : 'Dataset'}
              </span>
            </div>
            <div className="p-4">
              {loading && (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Carregando usuários...</p>
                </div>
              )}
              {!loading && users.length === 0 ? (
                <div className="rounded-xl border border-dashed border-borderSoft p-8 text-center">
                  <p className="text-base font-semibold text-textPrimary">Nenhum usuário encontrado</p>
                  <p className="text-sm text-textSecondary">Ajuste os filtros ou verifique as permissões de master admin.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uuid}>
                        <TableCell className="font-semibold text-textPrimary">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-textSecondary" />
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-textSecondary">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs uppercase tracking-wide text-textSecondary">{user.accountType}</TableCell>
                        <TableCell className="text-textSecondary">{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <PaginationControls
            meta={meta}
            isLoading={loading}
            perPageOptions={perPageOptions}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        </section>
      </PageWrapper>
    </DashboardShell>
  )
}
