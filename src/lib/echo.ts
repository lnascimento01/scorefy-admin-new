'use client'

import Echo from 'laravel-echo'
import ReverbConnector from '@/lib/reverb-connector'
import { getStoredToken } from '@/lib/auth-storage'

type EchoInstance = Echo | null

const env = (typeof window !== 'undefined' ? (import.meta as any)?.env : undefined) ?? (process.env as Record<string, string | undefined>)

const DRIVER = env?.NEXT_PUBLIC_ECHO_DRIVER ?? 'reverb'
const REVERB_KEY = env?.NEXT_PUBLIC_REVERB_APP_KEY ?? env?.VITE_REVERB_APP_KEY ?? ''
const REVERB_HOST = env?.NEXT_PUBLIC_REVERB_HOST ?? env?.VITE_REVERB_HOST ?? (typeof window !== 'undefined' ? window.location.hostname : 'localhost')
const REVERB_PORT = Number(env?.NEXT_PUBLIC_REVERB_PORT ?? env?.VITE_REVERB_PORT ?? 8087)
const REVERB_SCHEME = (env?.NEXT_PUBLIC_REVERB_SCHEME ?? env?.VITE_REVERB_SCHEME ?? 'ws').toLowerCase()
const REVERB_FORCE_TLS = (env?.NEXT_PUBLIC_REVERB_FORCE_TLS ?? env?.VITE_REVERB_FORCE_TLS ?? '').toLowerCase() === 'true'
const AUTH_ENDPOINT = env?.NEXT_PUBLIC_ECHO_AUTH_ENDPOINT ?? env?.VITE_ECHO_AUTH_ENDPOINT ?? '/broadcasting/auth'

let echo: EchoInstance = null

function shouldUseTLS() {
  if (REVERB_FORCE_TLS) return true
  if (REVERB_SCHEME === 'https' || REVERB_SCHEME === 'wss') return true
  if (typeof window !== 'undefined') return window.location.protocol === 'https:'
  return false
}

export function getEcho(): EchoInstance {
  if (typeof window === 'undefined') return null
  if (echo) return echo
  if (!REVERB_KEY) {
    console.warn('[echo] Missing Reverb app key configuration')
    return null
  }

  const token = getStoredToken()
  const forceTLS = shouldUseTLS()
  const scheme = forceTLS ? 'wss' : REVERB_SCHEME === 'https' ? 'wss' : REVERB_SCHEME || 'ws'
  const hostWithPort = `${REVERB_HOST}:${REVERB_PORT}`

  const options: any = {
    broadcaster: DRIVER,
    connector: ReverbConnector as any,
    key: REVERB_KEY,
    host: hostWithPort,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    scheme,
    forceTLS,
    authEndpoint: AUTH_ENDPOINT,
    auth: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true
    }
  }

  echo = new Echo(options)
  return echo
}

export function disconnectEcho() {
  if (!echo) return
  echo.disconnect()
  echo = null
}
