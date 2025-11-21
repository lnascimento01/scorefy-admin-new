import { getApi } from './api'

export interface LoginPayload {
  email: string
  password: string
  device_id: string
  platform: 'web' | 'android' | 'ios'
  device_name?: string
}

export interface LoginResponse {
  token?: string | null
  mfa_enabled: boolean
  role: string
  abilities: string[]
}

export interface AuthScope {
  uuid: string
  type: string
  name: string
  reference: string
}

export interface AuthAccess {
  can_access_admin_panel: boolean
  can_access_mobile_app: boolean
  requires_scope: boolean
  is_master: boolean
  token_abilities: string[]
}

export interface AuthProfile {
  uuid: string
  name: string
  email: string
  avatar_url: string | null
  role: string
  access: AuthAccess
  scopes: AuthScope[]
}

export async function login(payload: LoginPayload) {
  const api = await getApi()
  const { data } = await api.post<LoginResponse>('/v1/auth/sign-in', payload)
  return data
}

export async function logout() {
  const api = await getApi()
  await api.post('/v1/auth/sign-out')
}

export async function getProfile() {
  const api = await getApi()
  const { data } = await api.get<AuthProfile>('/v1/auth/me')
  return data
}
