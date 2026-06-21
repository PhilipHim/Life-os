export type TitleUnlockType = 'level' | 'achievement' | 'consistency'

export interface TitleUnlockCondition {
  type: TitleUnlockType
  label: string
}

export interface TitleDefinition {
  id: string
  name: string
  description: string
  /** Unlock when any condition is met. Empty = always unlocked. */
  conditions: TitleUnlockCondition[]
}

export interface UserTitle {
  id: string
  name: string
  description: string
  unlocked: boolean
  isActive: boolean
  unlockHint: string
  conditions: TitleUnlockCondition[]
  unlockedAt: number | null
}

export interface TitleState {
  titles: UserTitle[]
  activeTitle: UserTitle
  unlockedCount: number
}

/**
 * Ordered from entry-level to pinnacle. Add future titles to the end.
 */
export const TITLE_DEFINITIONS: TitleDefinition[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Every journey starts with a single step.',
    conditions: [],
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'You show up and ship meaningful work.',
    conditions: [
      { type: 'level', label: 'Reach Level 3' },
      { type: 'achievement', label: 'Unlock First Task' },
      { type: 'consistency', label: 'Maintain a 7-day habit streak' },
    ],
  },
  {
    id: 'focused_builder',
    name: 'Focused Builder',
    description: 'Deep work and execution define your rhythm.',
    conditions: [
      { type: 'level', label: 'Reach Level 7' },
      { type: 'achievement', label: 'Unlock Focused (100 tasks)' },
      { type: 'consistency', label: 'Log 30 journal entries' },
    ],
  },
  {
    id: 'disciplined_operator',
    name: 'Disciplined Operator',
    description: 'Systems run reliably because you do.',
    conditions: [
      { type: 'level', label: 'Reach Level 10' },
      { type: 'achievement', label: 'Unlock Consistent (7-day habit streak)' },
      { type: 'consistency', label: 'Unlock 5 achievements' },
    ],
  },
  {
    id: 'life_architect',
    name: 'Life Architect',
    description: 'You design balance across work, health, and mind.',
    conditions: [
      { type: 'level', label: 'Reach Level 15' },
      { type: 'achievement', label: 'Unlock Writer (50 journal entries)' },
      { type: 'consistency', label: 'Average Life Score 65+ (30 days)' },
    ],
  },
  {
    id: 'master_architect',
    name: 'Master Architect',
    description: 'Sustained excellence across every domain of life.',
    conditions: [
      { type: 'level', label: 'Reach Level 20' },
      { type: 'achievement', label: 'Unlock Master Executor or Iron Health' },
      { type: 'consistency', label: 'Reach a 30-day habit streak' },
    ],
  },
]

export const DEFAULT_TITLE_ID = 'beginner'
