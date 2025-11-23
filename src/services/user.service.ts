import { getApi } from './api'

const USERS_PATH = (process.env.NEXT_PUBLIC_USERS_PATH ?? '/v1/auth/users').replace(/\/$/, '')

function asString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  return null
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export type UserAccountType = 'master_admin' | string

export interface UserSummary {
  uuid: string
  name: string
  email: string
  accountType: UserAccountType
  createdAt?: string
  updatedAt?: string
}

export interface UsersPagination {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface UsersListResponse {
  items: UserSummary[]
  meta: UsersPagination
}

export interface UsersListParams {
  q?: string
  sort?: 'name' | '-name' | 'email' | '-email' | 'created_at' | '-created_at'
  page?: number
  perPage?: number
}

function normalizeUser(item: Record<string, unknown>): UserSummary | null {
  const uuid = asString(item.uuid)
  const name = asString(item.name)
  const email = asString(item.email)
  const accountType = asString(item.account_type ?? item.accountType)
  if (!uuid || !name || !email || !accountType) return null
  const createdAt = asString(item.created_at ?? item.createdAt) ?? undefined
  const updatedAt = asString(item.updated_at ?? item.updatedAt) ?? undefined
  return { uuid, name, email, accountType: accountType as UserAccountType, createdAt, updatedAt }
}

function normalizeMeta(meta: Record<string, unknown> | undefined): UsersPagination {
  const currentPage = asNumber(meta?.current_page) ?? asNumber(meta?.currentPage) ?? 1
  const lastPage = asNumber(meta?.last_page) ?? asNumber(meta?.lastPage) ?? currentPage
  const perPage = asNumber(meta?.per_page) ?? asNumber(meta?.perPage) ?? 30
  const total = asNumber(meta?.total) ?? 0
  return { currentPage, lastPage, perPage, total }
}

export const UsersGateway = {
  async list(params?: UsersListParams): Promise<UsersListResponse> {
    const api = await getApi()
    const { data } = await api.get(USERS_PATH, {
      params: {
        q: params?.q,
        sort: params?.sort,
        page: params?.page,
        per_page: params?.perPage
      }
    })

    const payload = data?.data ? data : { data, meta: data?.meta }
    const candidates = Array.isArray(payload.data) ? payload.data : []
    const items = candidates
      .map((item) => (item && typeof item === 'object' ? normalizeUser(item as Record<string, unknown>) : null))
      .filter((user): user is UserSummary => Boolean(user))

    const meta = normalizeMeta((payload.meta ?? {}) as Record<string, unknown>)
    return { items, meta }
  }
}
