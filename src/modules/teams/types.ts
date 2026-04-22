export interface TeamCountry {
  id: string
  name: string
  code?: string
}

export interface TeamSummary {
  id: string
  name: string
  shortName?: string
  slug?: string
  countryId?: string
  country?: TeamCountry | null
  city?: string
  colors: string[]
  meta?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface TeamListMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface TeamFormValues {
  name: string
  shortName: string
  slug: string
  countryId: string
  city: string
  colors: string[]
}

export interface TeamFilters {
  search: string
  countryId: string
  sort: 'name' | '-name' | 'created_at' | '-created_at'
  page: number
  perPage: number
}

export interface TeamUpsertPayload {
  name?: string
  shortName?: string | null
  slug?: string | null
  countryId?: string | null
  city?: string | null
  colors?: string[] | null
}
