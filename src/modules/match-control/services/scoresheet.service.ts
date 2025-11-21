import { getApi } from '@/services/api'

export interface ScoresheetPayload {
  filename: string
  mime: string
  base64: string
}

const MATCHES_PATH = process.env.NEXT_PUBLIC_MATCHES_PATH ?? '/v1/auth/matches'

export const ScoresheetGateway = {
  async fetch(matchId: string | number): Promise<ScoresheetPayload> {
    const id = String(matchId ?? '').trim()
    if (!id) {
      throw new Error('Match identifier is required.')
    }
    const api = await getApi()
    const { data } = await api.get(`${MATCHES_PATH}/${id}/scoresheet`)
    if (!data?.base64) {
      throw new Error('Súmula indisponível no momento.')
    }
    return {
      filename: data.filename ?? `sumula-${id}.pdf`,
      mime: data.mime ?? 'application/pdf',
      base64: data.base64
    }
  }
}
