import { Goal, Radio } from 'lucide-react'
import type { MatchQuickAction } from '../types'
import type { TranslationRecord } from '@/lib/i18n'

type MatchControlDictionary = TranslationRecord['matchControl']

export function resolveMatchQuickActions(copy: MatchControlDictionary): MatchQuickAction[] {
  const items = copy.quickActions.items
  return [
    {
      id: 'home-goal',
      label: items.homeGoal.label,
      description: items.homeGoal.description,
      team: 'home',
      tone: 'danger',
      icon: Goal,
      typeCode: 'goal',
      requiresPlayer: true
    },
    {
      id: 'away-goal',
      label: items.awayGoal.label,
      description: items.awayGoal.description,
      team: 'away',
      tone: 'danger',
      icon: Goal,
      typeCode: 'goal',
      requiresPlayer: true
    },
    {
      id: 'timeout-home',
      label: items.timeoutHome.label,
      description: items.timeoutHome.description,
      team: 'home',
      tone: 'info',
      icon: Radio,
      typeCode: 'timeout_home'
    },
    {
      id: 'timeout-away',
      label: items.timeoutAway.label,
      description: items.timeoutAway.description,
      team: 'away',
      tone: 'info',
      icon: Radio,
      typeCode: 'timeout_away'
    }
  ]
}
