import { AxiosInstance, AxiosRequestHeaders } from 'axios'
import { getStoredToken } from '@/lib/auth-storage'

let cached: AxiosInstance | null = null
let serverHttpsAgent: import('https').Agent | null = null

const AUTH_MODE = (process.env.NEXT_PUBLIC_AUTH_MODE ?? 'cookie').toLowerCase()
const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api'
const INTERNAL_API_BASE =
  process.env.INTERNAL_API_BASE ??
  process.env.API_PROXY_TARGET ??
  process.env.NEXT_PUBLIC_API_BASE ??
  'https://api.socrefy.localhost'
const shouldSendAppOrigin = typeof window === 'undefined' && process.env.NEXT_PUBLIC_APP_ORIGIN
const ALLOW_INSECURE_SSL = process.env.ALLOW_INSECURE_BACKEND_SSL === 'true'
const STATIC_BEARER_TOKEN = process.env.NEXT_PUBLIC_BEARER_TOKEN?.trim()

function getBaseURL() {
  const isServer = typeof window === 'undefined'
  return isServer ? INTERNAL_API_BASE : PUBLIC_API_BASE
}

async function getHttpsAgent() {
  if (typeof window !== 'undefined') return undefined
  if (!ALLOW_INSECURE_SSL) return undefined
  if (serverHttpsAgent) return serverHttpsAgent
  const https = await import('https')
  serverHttpsAgent = new https.Agent({ rejectUnauthorized: false })
  return serverHttpsAgent
}

function resolveBearerToken() {
  if (typeof window === 'undefined') {
    return STATIC_BEARER_TOKEN ?? null
  }
  const stored = getStoredToken()
  return stored ?? STATIC_BEARER_TOKEN ?? null
}

export async function getApi(): Promise<AxiosInstance> {
  if (cached) return cached
  const axiosModule = await import('axios')
  const axios = axiosModule.default ?? axiosModule
  const httpsAgent = await getHttpsAgent()
  const shouldSendCookies = AUTH_MODE !== 'bearer'

  cached = axios.create({
    baseURL: getBaseURL(),
    withCredentials: shouldSendCookies,
    httpsAgent,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(shouldSendAppOrigin ? { 'X-App-Origin': process.env.NEXT_PUBLIC_APP_ORIGIN! } : {}),
    },
  })

  cached.interceptors.request.use((config) => {
    const token = resolveBearerToken()
    if (!config.headers) config.headers = {}
    const headers = config.headers as AxiosRequestHeaders
    if (token) {
      headers.Authorization = `Bearer ${token}`
    } else {
      delete headers.Authorization
    }
    return config
  })

  return cached
}
