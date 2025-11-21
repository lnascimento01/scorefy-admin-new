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
