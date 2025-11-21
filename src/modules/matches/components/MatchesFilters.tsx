'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MatchStatus } from '../types'

interface Option {
  value: string
  label: string
}

interface MatchesFiltersProps {
  searchValue: string
  competitionValue: string
  statusValue: MatchStatus | 'all'
  dateValue?: string
  competitionOptions: Option[]
  onSearchChange: (value: string) => void
  onCompetitionChange: (value: string) => void
  onStatusChange: (value: MatchStatus | 'all') => void
  onDateChange: (value: string) => void
  lastSync?: string
}

function formatSyncLabel(timestamp?: string) {
  if (!timestamp) return ''
  try {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

export function MatchesFilters({
  searchValue,
  competitionValue,
  statusValue,
  dateValue,
  competitionOptions,
  onSearchChange,
  onCompetitionChange,
  onStatusChange,
  onDateChange,
  lastSync
}: MatchesFiltersProps) {
  const syncLabel = formatSyncLabel(lastSync)

  return (
    <div className="card flex flex-col gap-4 p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          placeholder="Buscar por equipe"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Select value={competitionValue} onChange={(event) => onCompetitionChange(event.target.value)}>
          <option value="all">Todas as competições</option>
          {competitionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={statusValue} onChange={(event) => onStatusChange(event.target.value as MatchStatus | 'all')}>
          <option value="all">Todos status</option>
          <option value="scheduled">Agendadas</option>
          <option value="not_started">Não iniciadas</option>
          <option value="live">Ao vivo</option>
          <option value="paused">Pausadas</option>
          <option value="halftime">Intervalo</option>
          <option value="finished">Finalizadas</option>
          <option value="canceled">Canceladas</option>
        </Select>
        <Input type="date" value={dateValue ?? ''} onChange={(event) => onDateChange(event.target.value)} />
      </div>
      {syncLabel && <p className="text-sm text-textSecondary">Última sincronização: <span className="font-semibold text-textPrimary">{syncLabel}</span></p>}
    </div>
  )
}
