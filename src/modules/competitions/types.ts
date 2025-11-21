export interface CompetitionSummary {
  id: string
  name: string
  season?: string
  type?: string
  country?: string
  category?: string
  scope?: string
  naipe?: string
  updatedAt?: string
  status: 'active' | 'deleted'
  metaSummary?: string | null
}

export interface CompetitionListMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}
