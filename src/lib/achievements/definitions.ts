import type { ProfileStats } from '@/lib/profile/types'

export type AchievementCategory = 'task' | 'journal' | 'health' | 'habit' | 'focus' | 'routine'

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
    id: 'first_mission',
    category: 'task',
    title: 'Mission Accomplished',
    description: 'Complete your first ASCEND mission',
    target: 1,
    getValue: () => 0,
  },
  {
    id: 'first_task',
    category: 'task',
    title: 'First Task',
    description: 'Complete 1 task',
    target: 1,
    getValue: (s) => s.tasksCompleted,
  },
  {
    id: 'task_sprinter',
    category: 'task',
    title: 'Task Sprinter',
    description: 'Complete 25 tasks',
    target: 25,
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
    id: 'journal_mindful',
    category: 'journal',
    title: 'Mindful Voice',
    description: 'Write 25 journal entries',
    target: 25,
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
    id: 'wellness_steady',
    category: 'health',
    title: 'Steady Wellness',
    description: '14 days without sickness',
    target: 14,
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
    id: 'habit_warrior',
    category: 'habit',
    title: 'Habit Warrior',
    description: '14 day habit streak',
    target: 14,
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
  {
    id: 'habit_dedicated',
    category: 'habit',
    title: 'Habit Dedicated',
    description: 'Log 50 successful habit days',
    target: 50,
    getValue: (s) => s.habitsCompleted,
  },
  {
    id: 'focus_initiate',
    category: 'focus',
    title: 'Focus Initiate',
    description: 'Complete 1 focus session',
    target: 1,
    getValue: (s) => s.focusSessions,
  },
  {
    id: 'focus_marathon',
    category: 'focus',
    title: 'Focus Marathon',
    description: 'Log 500 focus minutes',
    target: 500,
    getValue: (s) => s.focusMinutes,
    formatValue: (v) => `${v} min`,
  },
  {
    id: 'focus_locked_in',
    category: 'focus',
    title: 'Locked In',
    description: 'Maintain a 7-day focus streak',
    target: 7,
    getValue: (s) => s.currentStreaks.focus,
    formatValue: (v) => `${v} days`,
  },
  {
    id: 'routine_builder',
    category: 'routine',
    title: 'Routine Builder',
    description: 'Create 3 routines',
    target: 3,
    getValue: (s) => s.routinesCreated,
  },
  {
    id: 'routine_architect',
    category: 'routine',
    title: 'Routine Architect',
    description: 'Create 10 routines',
    target: 10,
    getValue: (s) => s.routinesCreated,
  },
]

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  task: 'Tasks',
  journal: 'Journal',
  health: 'Health',
  habit: 'Habits',
  focus: 'Focus',
  routine: 'Routines',
}
