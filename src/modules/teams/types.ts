export type TeamStatus = 'active' | 'inactive' | 'draft'

export interface TeamSummary {
  id: string
  name: string
  shortName?: string
  city?: string
  state?: string
  country?: string
  category?: string
  gender?: string
  status: TeamStatus
  totalPlayers?: number
  coach?: string
  updatedAt?: string
  foundedAt?: string
}

export interface TeamListMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}
