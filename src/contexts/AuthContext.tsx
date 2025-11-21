'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  AuthProfile,
  LoginPayload,
  getProfile,
  login,
  logout,
} from '@/services/auth.service'
import {
  clearStoredToken,
  getDeviceName,
  getOrCreateDeviceId,
  persistToken,
} from '@/lib/auth-storage'

interface SignInCredentials {
  email: string
  password: string
}

interface AuthContextProps {
  user: AuthProfile | null
  loading: boolean
  processing: boolean
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps)

const ADMIN_ACCESS_ABILITY = 'admin:access'

function ensureAdminAccess(profile: AuthProfile) {
  const canAccessPanel = profile.access?.can_access_admin_panel
  const abilities = profile.access?.token_abilities ?? []
  if (!canAccessPanel || !abilities.includes(ADMIN_ACCESS_ABILITY)) {
    throw new Error('Seu usuário não tem permissão para acessar o painel administrativo.')
  }
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as {
      message?: string
      errors?: Record<string, string[]>
    }
    if (data?.message) return data.message
    if (data?.errors) {
      const firstError = Object.values(data.errors).flat().find(Boolean)
      if (firstError) return firstError
    }
  }

  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getProfile()
      ensureAdminAccess(profile)
      setUser(profile)
      return profile
    } catch (error) {
      setUser(null)
      clearStoredToken()
      throw error
    }
  }, [])

  useEffect(() => {
    refreshProfile()
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [refreshProfile])

  const signIn = useCallback(
    async ({ email, password }: SignInCredentials) => {
      setProcessing(true)
      try {
        const payload: LoginPayload = {
          email,
          password,
          device_id: getOrCreateDeviceId(),
          device_name: getDeviceName(),
          platform: 'web',
        }

        const response = await login(payload)
        if (response.token) {
          persistToken(response.token)
        }
        await refreshProfile()
      } catch (error) {
        clearStoredToken()
        throw new Error(resolveErrorMessage(error))
      } finally {
        setProcessing(false)
      }
    },
    [refreshProfile],
  )

  const signOut = useCallback(async () => {
    try {
      await logout()
    } finally {
      clearStoredToken()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, processing, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
