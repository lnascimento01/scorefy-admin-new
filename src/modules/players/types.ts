export interface PlayerTeamSummary {
  id: string
  name: string
  shortName?: string
}

export interface PlayerPositionSummary {
  id: string
  name: string
  code?: string
}

export interface PlayerSummary {
  id: string
  teamId?: string
  team?: PlayerTeamSummary | null
  positionId?: string
  position?: PlayerPositionSummary | null
  firstName: string
  lastName: string
  nickname?: string
  fullName: string
  birthdate?: string
  number?: number | null
  nationality?: string
  isActive: boolean
  meta: unknown
  createdAt?: string
  updatedAt?: string
}

export interface PlayerListMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface PlayerCatalogOption {
  id: string
  label: string
  secondaryLabel?: string
}

export interface PlayerListParams {
  q?: string
  teamId?: string
  isActive?: boolean
  page?: number
  perPage?: number
}

export interface PlayerListResult {
  items: PlayerSummary[]
  meta: PlayerListMeta
  source: 'api'
}

export interface PlayerUpsertPayload {
  teamId?: string | null
  positionId?: string | null
  firstName?: string
  lastName?: string
  nickname?: string | null
  birthdate?: string | null
  number?: number | null
  nationality?: string | null
  isActive?: boolean
  meta?: Record<string, unknown> | null
}

export interface PlayerTransferPayload {
  teamId: string
}

export interface PlayerFormValues {
  teamId: string
  positionId: string
  firstName: string
  lastName: string
  nickname: string
  birthdate: string
  number: string
  nationality: string
  isActive: 'active' | 'inactive'
}
