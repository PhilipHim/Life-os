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
    id: 'the_beginner',
    name: 'The Beginner',
    description: 'You completed your first mission and began your ASCEND journey.',
    conditions: [{ type: 'achievement', label: 'Complete your first mission' }],
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'You explore ASCEND with curiosity and intent.',
    conditions: [
      { type: 'level', label: 'Reach Level 2' },
      { type: 'achievement', label: 'Unlock Mission Accomplished' },
    ],
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
    id: 'steady_hand',
    name: 'Steady Hand',
    description: 'Consistency is becoming your superpower.',
    conditions: [
      { type: 'level', label: 'Reach Level 5' },
      { type: 'achievement', label: 'Unlock Habit Warrior (14-day streak)' },
      { type: 'consistency', label: 'Unlock 3 achievements' },
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
    id: 'focus_monk',
    name: 'Focus Monk',
    description: 'Distraction fades when you enter the zone.',
    conditions: [
      { type: 'level', label: 'Reach Level 8' },
      { type: 'achievement', label: 'Unlock Focus Marathon' },
      { type: 'achievement', label: 'Unlock Locked In (7-day focus streak)' },
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
    id: 'chronicler',
    name: 'Chronicler',
    description: 'Reflection sharpens your direction.',
    conditions: [
      { type: 'level', label: 'Reach Level 12' },
      { type: 'achievement', label: 'Unlock Mindful Voice (25 journal entries)' },
      { type: 'consistency', label: 'Maintain a 14-day journal streak' },
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
    id: 'peak_performer',
    name: 'Peak Performer',
    description: 'Your output and clarity rise together.',
    conditions: [
      { type: 'level', label: 'Reach Level 18' },
      { type: 'achievement', label: 'Unlock Master Executor' },
      { type: 'consistency', label: 'Productivity average 75+ (30 days)' },
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
  {
    id: 'ascendant',
    name: 'Ascendant',
    description: 'You operate at the highest level of personal growth.',
    conditions: [
      { type: 'level', label: 'Reach Level 25' },
      { type: 'achievement', label: 'Unlock 12 achievements' },
      { type: 'consistency', label: 'Average Life Score 75+ (30 days)' },
    ],
  },
]

export const DEFAULT_TITLE_ID = 'beginner'
