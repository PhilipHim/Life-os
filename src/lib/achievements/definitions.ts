import type { ProfileStats } from '@/lib/profile/types'

export type AchievementCategory = 'task' | 'journal' | 'health' | 'habit'

export interface AchievementDefinition {
  id: string
  category: AchievementCategory
  title: string
  description: string
  target: number
  getValue: (stats: ProfileStats) => number
  formatValue?: (value: number) => string
}

export interface Achievement {
  id: string
  category: AchievementCategory
  title: string
  description: string
  unlocked: boolean
  current: number
  target: number
  progress: number
  progressLabel: string
  unlockedAt: number | null
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_task',
    category: 'task',
    title: 'First Task',
    description: 'Complete 1 task',
    target: 1,
    getValue: (s) => s.tasksCompleted,
  },
  {
    id: 'focused',
    category: 'task',
    title: 'Focused',
    description: 'Complete 100 tasks',
    target: 100,
    getValue: (s) => s.tasksCompleted,
  },
  {
    id: 'master_executor',
    category: 'task',
    title: 'Master Executor',
    description: 'Complete 500 tasks',
    target: 500,
    getValue: (s) => s.tasksCompleted,
  },
  {
    id: 'first_reflection',
    category: 'journal',
    title: 'First Reflection',
    description: 'Write 1 journal entry',
    target: 1,
    getValue: (s) => s.journalEntries,
  },
  {
    id: 'writer',
    category: 'journal',
    title: 'Writer',
    description: 'Write 50 journal entries',
    target: 50,
    getValue: (s) => s.journalEntries,
  },
  {
    id: 'healthy',
    category: 'health',
    title: 'Healthy',
    description: '30 days without sickness',
    target: 30,
    getValue: (s) => s.longestWellnessStreak,
    formatValue: (v) => `${v} days`,
  },
  {
    id: 'iron_health',
    category: 'health',
    title: 'Iron Health',
    description: '100 days without sickness',
    target: 100,
    getValue: (s) => s.longestWellnessStreak,
    formatValue: (v) => `${v} days`,
  },
  {
    id: 'consistent',
    category: 'habit',
    title: 'Consistent',
    description: '7 day habit streak',
    target: 7,
    getValue: (s) => s.longestHabitStreak,
    formatValue: (v) => `${v} days`,
  },
  {
    id: 'habit_master',
    category: 'habit',
    title: 'Habit Master',
    description: '30 day habit streak',
    target: 30,
    getValue: (s) => s.longestHabitStreak,
    formatValue: (v) => `${v} days`,
  },
]

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  task: 'Tasks',
  journal: 'Journal',
  health: 'Health',
  habit: 'Habits',
}
