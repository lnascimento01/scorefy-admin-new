'use client'

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getStoredToken } from '@/lib/auth-storage'

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo?: Echo
    getEcho?: () => Echo | null
  }
}

let echo: Echo | null = null
let initPromise: Promise<Echo> | null = null
let csrfPromise: Promise<void> | null = null

const SANCTUM_CSRF_URL =
  process.env.NEXT_PUBLIC_SANCTUM_CSRF_URL ?? 'https://localhost:8686/sanctum/csrf-cookie'
const AUTH_ENDPOINT =
  process.env.NEXT_PUBLIC_ECHO_AUTH_ENDPOINT ?? 'https://localhost:8686/broadcasting/auth'

async function ensureSanctumCookies() {
  if (csrfPromise) return csrfPromise

  csrfPromise = fetch(SANCTUM_CSRF_URL, {
    method: 'GET',
    credentials: 'include'
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`[echo] Falha ao obter cookie do Sanctum: ${response.status}`)
    }
  }).catch((error) => {
    csrfPromise = null
    throw error
  })

  return csrfPromise
}

async function createEchoInstance() {
  // De acordo com a doc do Reverb, usamos REVERB_* como base
  const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY
  const host = process.env.NEXT_PUBLIC_REVERB_HOST ?? 'localhost'
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8087)
  const schemeEnv = process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http'

  const isHttps = window.location.protocol === 'https:'
  const scheme = schemeEnv || (isHttps ? 'https' : 'http')
  const forceTLS = scheme === 'https'

  if (!key) {
    console.warn('[echo] Missing NEXT_PUBLIC_REVERB_APP_KEY')
  }

  const token = getStoredToken()

  // Pusher precisa ser global pro Echo usar
  window.Pusher = Pusher
  window.Pusher.logToConsole = true

  return new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: AUTH_ENDPOINT,
    auth: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true
    }
  })
}

async function ensureEchoInstance(): Promise<Echo> {
  if (echo) return echo
  if (initPromise) return initPromise

  initPromise = ensureSanctumCookies()
    .catch((error) => {
      console.error('[echo] Não foi possível obter cookie do Sanctum', error)
      throw error
    })
    .then(() => createEchoInstance())
    .then((instance) => {
      echo = instance
      window.Echo = echo
      return instance
    })
    .catch((error) => {
      initPromise = null
      throw error
    })

  return initPromise
}

export async function getEcho(): Promise<Echo> {
  if (typeof window === 'undefined') {
    throw new Error('[echo] getEcho só pode ser usado no browser')
  }
  if (echo) return echo
  return ensureEchoInstance()
}

export function getEchoSync(): Echo | null {
  return echo
}

export function disconnectEcho() {
  if (!echo) return
  echo.disconnect()
  echo = null
  initPromise = null
}

// expor pra usar no console
if (typeof window !== 'undefined') {
  window.getEcho = getEchoSync
}
