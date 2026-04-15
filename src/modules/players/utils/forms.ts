import type { PlayerFormValues, PlayerSummary, PlayerUpsertPayload } from '../types'

export const EMPTY_PLAYER_FORM: PlayerFormValues = {
  teamId: '',
  positionId: '',
  firstName: '',
  lastName: '',
  nickname: '',
  birthdate: '',
  number: '',
  nationality: '',
  isActive: 'active',
}

export function playerToFormValues(player: PlayerSummary): PlayerFormValues {
  return {
    teamId: player.teamId ?? '',
    positionId: player.positionId ?? '',
    firstName: player.firstName,
    lastName: player.lastName,
    nickname: player.nickname ?? '',
    birthdate: player.birthdate ?? '',
    number: player.number !== null && player.number !== undefined ? String(player.number) : '',
    nationality: player.nationality ?? '',
    isActive: player.isActive ? 'active' : 'inactive',
  }
}

export function formValuesToPayload(values: PlayerFormValues): PlayerUpsertPayload {
  return {
    teamId: values.teamId || null,
    positionId: values.positionId || null,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    nickname: values.nickname.trim() || null,
    birthdate: values.birthdate || null,
    number: values.number.trim() ? Number(values.number) : null,
    nationality: values.nationality.trim() || null,
    isActive: values.isActive === 'active',
    meta: {},
  }
}
