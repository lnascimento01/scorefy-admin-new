import type { AxiosError } from 'axios'

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

export function resolveMatchActionError(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'object' && error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    const data = axiosError.response?.data
    const validationMessage = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    if (typeof data?.message === 'string') {
      return data.message
    }
    if (validationMessage) {
      return validationMessage
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallbackMessage
}

export function resolveSeasonAmbiguity(error: unknown): string | null {
  if (typeof error === 'object' && error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    if (axiosError.response?.status !== 422) return null
    const data = axiosError.response?.data
    const errorKeys = data?.errors ? Object.keys(data.errors) : []
    const hasSeasonKey =
      errorKeys.includes('competition_season_id') ||
      errorKeys.includes('competitionSeasonId') ||
      errorKeys.includes('season') ||
      errorKeys.includes('competition_season')
    if (hasSeasonKey) {
      return 'Selecione uma temporada para continuar.'
    }
    if (typeof data?.message === 'string' && data.message.toLowerCase().includes('temporada')) {
      return 'Selecione uma temporada para continuar.'
    }
  }
  return null
}
