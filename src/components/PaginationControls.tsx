'use client'

import { Button } from '@/components/ui/button'

interface PaginationMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

interface PaginationControlsProps {
  meta: PaginationMeta
  isLoading?: boolean
  perPageOptions?: number[]
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
}

export function PaginationControls({ meta, isLoading, perPageOptions = [10, 20, 50], onPageChange, onPerPageChange }: PaginationControlsProps) {
  const canGoPrev = meta.currentPage > 1
  const canGoNext = meta.currentPage < meta.lastPage

  return (
    <div className="flex flex-col gap-3 border-t border-borderSoft pt-4 text-sm text-textSecondary md:flex-row md:items-center md:justify-between">
      <div>
        Página {meta.currentPage} de {meta.lastPage} • {meta.total} partidas
      </div>
      <div className="flex items-center gap-3">
        <select
          className="rounded-xl border border-borderSoft bg-[var(--surface-elevated-strong)] px-3 py-1 text-xs text-textPrimary"
          value={meta.perPage}
          onChange={(event) => onPerPageChange?.(Number(event.target.value))}
          disabled={isLoading}
        >
          {perPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}/página
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={!canGoPrev || isLoading} onClick={() => canGoPrev && onPageChange?.(meta.currentPage - 1)}>
            Anterior
          </Button>
          <Button size="sm" variant="outline" disabled={!canGoNext || isLoading} onClick={() => canGoNext && onPageChange?.(meta.currentPage + 1)}>
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
