const TOKEN_STORAGE_KEY = 'scorefy:auth-token'
const DEVICE_ID_STORAGE_KEY = 'scorefy-admin-web'
const DEVICE_NAME_MAX_LENGTH = 80
const DEVICE_NAME_SPLATFORM = 'web'

const isBrowser = typeof window !== 'undefined'

function createRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getStoredToken() {
  if (!isBrowser) return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getStoredPlatform() {
  window.localStorage.setItem(DEVICE_NAME_SPLATFORM, 'web')
}

export function persistToken(token: string) {
  if (!isBrowser) return
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken() {
  if (!isBrowser) return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function getOrCreateDeviceId() {
  if (!isBrowser) return createRandomId()

  const existingId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existingId) return existingId

  const newId = createRandomId()
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, newId)

  return newId
}

export function getDeviceName() {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return undefined
  }
  const name = navigator.userAgent.trim()
  if (!name) return undefined
  return name.slice(0, DEVICE_NAME_MAX_LENGTH)
}
