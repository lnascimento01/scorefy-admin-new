'use client'

import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { TeamCountry, TeamFormValues } from '../types'

interface TeamFormProps {
  value: TeamFormValues
  onChange: (patch: Partial<TeamFormValues>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  submitting: boolean
  submitLabel: string
  countries: TeamCountry[]
}

const COLOR_SLOTS = 5

export function TeamForm({ value, onChange, onSubmit, onCancel, submitting, submitLabel, countries }: TeamFormProps) {
  const colorValues = [...value.colors]
  while (colorValues.length < COLOR_SLOTS) {
    colorValues.push('')
  }

  function updateColor(index: number, nextValue: string) {
    const nextColors = [...colorValues]
    nextColors[index] = nextValue
    onChange({
      colors: nextColors.map((entry) => entry.trim()).filter(Boolean).slice(0, COLOR_SLOTS),
    })
  }

  return (
    <form className="card space-y-5 p-6" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Nome</span>
          <Input value={value.name} onChange={(event) => onChange({ name: event.target.value })} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Abreviação</span>
          <Input value={value.shortName} onChange={(event) => onChange({ shortName: event.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">Slug</span>
          <Input value={value.slug} onChange={(event) => onChange({ slug: event.target.value })} placeholder="aurora-handball-club" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-textSecondary">País</span>
          <Select value={value.countryId} onChange={(event) => onChange({ countryId: event.target.value })}>
            <option value="">Não informado</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
                {country.code ? ` (${country.code})` : ''}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-textSecondary">Cidade</span>
          <Input value={value.city} onChange={(event) => onChange({ city: event.target.value })} />
        </label>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm text-textSecondary">Cores</p>
          <p className="text-xs text-textSecondary">Use até 5 valores, preferencialmente em hexadecimal como `#0F172A`.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {colorValues.map((color, index) => (
            <label key={`team-color-${index}`} className="space-y-1 text-sm">
              <span className="text-textSecondary">{`Cor ${index + 1}`}</span>
              <Input value={color} onChange={(event) => updateColor(index, event.target.value)} placeholder="#000000" />
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
