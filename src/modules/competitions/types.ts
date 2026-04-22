export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue
}

export type CompetitionStatus = 'draft' | 'published' | 'archived'
export type CompetitionScope = 'national' | 'state' | 'international'
export type CompetitionNaipe = 'masculino' | 'feminino' | 'misto'
export type CompetitionSort = 'name' | '-name' | 'created_at' | '-created_at'

export interface CompetitionCountry {
  id: string
  name: string
  code?: string
}

export interface CompetitionTypeOption {
  id: string
  name: string
  slug?: string
  description?: string
  defaults?: JsonValue
}

export interface Competition {
  id: string
  name: string
  locale: string
  status: CompetitionStatus
  typeId: string
  typeName?: string
  countryId?: string
  country?: CompetitionCountry | null
  scope: CompetitionScope
  naipe?: CompetitionNaipe | null
  category?: string | null
  meta: JsonValue
  seasonsCount?: number
  latestSeason?: CompetitionSeasonListItem | null
  createdAt?: string
  updatedAt?: string
}

export interface CompetitionSeasonListItem {
  id: string
  name: string
  label?: string
  season: string
  status: CompetitionStatus
  competitionId: string
  availableNaipes?: CompetitionNaipe[]
  referenceYearStart?: number
  referenceYearEnd?: number
  startAt?: string | null
  endAt?: string | null
  meta?: JsonValue
  updatedAt?: string
}

export interface CompetitionSeason extends CompetitionSeasonListItem {
  configOverrides: JsonValue
  effectiveConfig: JsonValue
  registrationSettings?: CompetitionSeasonRegistrationSettings | null
  handballRule?: CompetitionHandballRule | null
  createdAt?: string
}

export type RegistrationWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'withdrawn'

export type RegistrationEligibilityStatus =
  | 'pending'
  | 'eligible'
  | 'ineligible'
  | 'suspended'
  | 'blocked_by_transfer'

export interface CompetitionSeasonRegistrationSettings {
  enabled: boolean
  windowStartAt?: string
  windowEndAt?: string
  lateEntryStartAt?: string
  lateEntryEndAt?: string
  minRosterSize?: number
  maxRosterSize?: number
  allowReplacementAfterApproval: boolean
  lockAfterAt?: string
  requireUniqueShirtNumber: boolean
  ageMin?: number
  ageMax?: number
  requireDocuments: boolean
}

export interface CompetitionSeasonRegistrationTeamSummary {
  id: string
  name: string
  shortName?: string
  city?: string
  state?: string
  country?: string
}

export interface CompetitionSeasonRegistrationPlayerSummary {
  id: string
  teamId?: string
  fullName: string
  nickname?: string
  number?: number
  positionName?: string
  isActive?: boolean
}

export interface CompetitionSeasonTeamPlayerRegistration {
  id: string
  competitionSeasonTeamRegistrationId: string
  playerId: string
  registrationStatus: RegistrationWorkflowStatus
  eligibilityStatus: RegistrationEligibilityStatus
  shirtNumber?: number | null
  position?: string | null
  isCaptain: boolean
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  removedAt?: string
  suspendedAt?: string
  notes?: string | null
  rejectionReason?: string | null
  meta: JsonValue
  isActive: boolean
  player?: CompetitionSeasonRegistrationPlayerSummary | null
  createdAt?: string
  updatedAt?: string
}

export interface CompetitionSeasonTeamRegistration {
  id: string
  competitionSeasonId: string
  teamId: string
  registrationStatus: RegistrationWorkflowStatus
  eligibilityStatus: RegistrationEligibilityStatus
  submittedAt?: string
  reviewedAt?: string
  approvedAt?: string
  rejectedAt?: string
  withdrawnAt?: string
  suspendedAt?: string
  lockedAt?: string
  notes?: string | null
  rejectionReason?: string | null
  meta: JsonValue
  playersCount: number
  activePlayersCount: number
  eligiblePlayersCount: number
  pendingPlayersCount: number
  ineligiblePlayersCount: number
  pendingAlerts: string[]
  registrationSettings?: CompetitionSeasonRegistrationSettings | null
  team?: CompetitionSeasonRegistrationTeamSummary | null
  players?: CompetitionSeasonTeamPlayerRegistration[]
  createdAt?: string
  updatedAt?: string
}

export interface CompetitionSeasonTeamRegistrationCreatePayload {
  teamId: string
  registrationStatus?: RegistrationWorkflowStatus
  eligibilityStatus?: RegistrationEligibilityStatus
  notes?: string | null
  rejectionReason?: string | null
  meta?: JsonValue
}

export interface CompetitionSeasonTeamRegistrationUpdatePayload {
  registrationStatus?: RegistrationWorkflowStatus
  eligibilityStatus?: RegistrationEligibilityStatus
  notes?: string | null
  rejectionReason?: string | null
  meta?: JsonValue
}

export interface CompetitionSeasonTeamPlayerRegistrationCreatePayload {
  playerId: string
  registrationStatus?: RegistrationWorkflowStatus
  eligibilityStatus?: RegistrationEligibilityStatus
  shirtNumber?: number | null
  position?: string | null
  isCaptain?: boolean
  notes?: string | null
  rejectionReason?: string | null
  meta?: JsonValue
}

export interface CompetitionSeasonTeamPlayerRegistrationUpdatePayload {
  registrationStatus?: RegistrationWorkflowStatus
  eligibilityStatus?: RegistrationEligibilityStatus
  shirtNumber?: number | null
  position?: string | null
  isCaptain?: boolean
  notes?: string | null
  rejectionReason?: string | null
  meta?: JsonValue
}

export interface CompetitionHandballRule {
  pointsForWin?: number
  pointsForDraw?: number
  pointsForLoss?: number
  pointsForOvertimeWin?: number
  pointsForOvertimeLoss?: number
  pointsForPenaltyWin?: number
  pointsForPenaltyLoss?: number
  allowDraws?: boolean
  tiebreakers: string[]
  updatedAt?: string
}

export interface CompetitionListMeta {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface CompetitionListFilters {
  q?: string
  countryId?: string
  scope?: CompetitionScope
  typeId?: string
  naipe?: CompetitionNaipe
  category?: string
  page?: number
  perPage?: number
  sort?: CompetitionSort
}

export interface CompetitionCreatePayload {
  name: string
  locale?: string
  status?: CompetitionStatus
  typeId: string
  countryId?: string
  scope?: CompetitionScope
  naipe?: CompetitionNaipe
  category?: string
  meta?: JsonValue
}

export interface CompetitionUpdatePayload {
  name?: string
  locale?: string
  status?: CompetitionStatus
  typeId?: string
  countryId?: string | null
  scope?: CompetitionScope
  naipe?: CompetitionNaipe | null
  category?: string | null
  meta?: JsonValue
}

export interface CompetitionSeasonCreatePayload {
  name: string
  label: string
  season: string
  status?: CompetitionStatus
  referenceYearStart?: number
  referenceYearEnd?: number
  startAt?: string | null
  endAt?: string | null
  meta?: JsonValue
}

export interface CompetitionSeasonUpdatePayload {
  name?: string
  label?: string
  season?: string
  status?: CompetitionStatus
  referenceYearStart?: number
  referenceYearEnd?: number
  startAt?: string | null
  endAt?: string | null
  meta?: JsonValue
}

export interface CompetitionConfigSnapshot {
  competitionSeasonId: string
  overrides: JsonValue
  effective: JsonValue
  updatedAt?: string
}

export interface CompetitionHandballRulesPayload {
  pointsForWin?: number
  pointsForDraw?: number
  pointsForLoss?: number
  pointsForOvertimeWin?: number
  pointsForOvertimeLoss?: number
  pointsForPenaltyWin?: number
  pointsForPenaltyLoss?: number
  allowDraws?: boolean
  tiebreakers?: string[]
}

export interface CompetitionHandballRulesSnapshot {
  competitionSeasonId: string
  updatedAt?: string
  rules: CompetitionHandballRule
}

export type CompetitionStandingsScope = 'global' | 'stage' | 'group'
export type CompetitionStandingsSort = 'points' | '-points' | 'goal_diff' | '-goal_diff' | 'wins' | '-wins' | 'created_at' | '-created_at'

export interface CompetitionStandingStageSummary {
  id: string
  name: string
  kind?: string | null
  order?: number
  naipe?: CompetitionNaipe | null
}

export interface CompetitionStandingGroupSummary {
  id: string
  name: string
  order?: number
  naipe?: CompetitionNaipe | null
  stageId?: string | null
  stage?: CompetitionStandingStageSummary | null
}

export interface CompetitionStandingTeamSummary {
  id: string
  name: string
  shortName?: string
}

export interface CompetitionStandingRow {
  id: string
  competitionId: string
  competitionSeasonId: string
  naipe?: CompetitionNaipe | null
  stageId?: string | null
  groupId?: string | null
  teamId: string
  team?: CompetitionStandingTeamSummary | null
  stage?: CompetitionStandingStageSummary | null
  group?: CompetitionStandingGroupSummary | null
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  rank?: number | null
  form: string[]
  streak?: string | null
  winPercentage: number
  averageGoalsFor: number
  averageGoalsAgainst: number
  recentResults: string[]
  meta: JsonValue
  updatedAt?: string
}

export interface CompetitionStandingsFilters {
  competitionSeasonId: string
  naipe?: CompetitionNaipe
  stageId?: string
  groupId?: string
  sort?: CompetitionStandingsSort
  page?: number
  perPage?: number
}
