'use client'

import { FormEvent } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { PlayerCatalogOption, PlayerFormValues } from '../types'

interface PlayerFormProps {
  value: PlayerFormValues
  onChange: (patch: Partial<PlayerFormValues>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  submitting?: boolean
  submitLabel: string
  teamOptions: PlayerCatalogOption[]
  positionOptions: PlayerCatalogOption[]
  teamDisabled?: boolean
  teamHint?: string
}

export function PlayerForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  teamOptions,
  positionOptions,
  teamDisabled,
  teamHint,
}: PlayerFormProps) {
  return (
    <form className="card space-y-5 p-6" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Equipe base</span>
          <Select
            value={value.teamId}
            onChange={(event) => onChange({ teamId: event.target.value })}
            disabled={teamDisabled || submitting}
          >
            <option value="">Sem equipe</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.secondaryLabel ? `${team.label} • ${team.secondaryLabel}` : team.label}
              </option>
            ))}
          </Select>
          {teamHint && <p className="text-xs text-textSecondary">{teamHint}</p>}
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Posição</span>
          <Select
            value={value.positionId}
            onChange={(event) => onChange({ positionId: event.target.value })}
            disabled={submitting}
          >
            <option value="">Sem posição</option>
            {positionOptions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.secondaryLabel ? `${position.secondaryLabel} • ${position.label}` : position.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Nome</span>
          <Input
            value={value.firstName}
            onChange={(event) => onChange({ firstName: event.target.value })}
            required
            disabled={submitting}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Sobrenome</span>
          <Input
            value={value.lastName}
            onChange={(event) => onChange({ lastName: event.target.value })}
            required
            disabled={submitting}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Apelido</span>
          <Input
            value={value.nickname}
            onChange={(event) => onChange({ nickname: event.target.value })}
            disabled={submitting}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Status</span>
          <Select
            value={value.isActive}
            onChange={(event) => onChange({ isActive: event.target.value as PlayerFormValues['isActive'] })}
            disabled={submitting}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </Select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Data de nascimento</span>
          <Input
            type="date"
            value={value.birthdate}
            onChange={(event) => onChange({ birthdate: event.target.value })}
            disabled={submitting}
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Número base</span>
          <Input
            type="number"
            min={0}
            max={999}
            value={value.number}
            onChange={(event) => onChange({ number: event.target.value })}
            disabled={submitting}
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-textSecondary">Nacionalidade (ISO 2)</span>
          <Input
            value={value.nationality}
            onChange={(event) => onChange({ nationality: event.target.value.toUpperCase() })}
            maxLength={2}
            disabled={submitting}
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
