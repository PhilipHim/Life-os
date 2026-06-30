export interface ProfileStats {
  tasksCompleted: number
  habitsCompleted: number
  journalEntries: number
  daysWithoutSickness: number
  longestWellnessStreak: number
  focusSessions: number
  focusMinutes: number
  routinesCreated: number
  currentStreaks: {
    habit: number
    journal: number
    focus: number
  }
  longestHabitStreak: number
  longestHabitName: string | null
  lifeScoreAverage: number | null
  productivityScoreAverage: number | null
}

export interface ProfileProgress {
  totalXp: number
  level: number
  currentXp: number
  xpToNextLevel: number
  xpRemaining: number
  progressPct: number
  title: string
}

export interface Achievement {
  id: string
  category: 'task' | 'journal' | 'health' | 'habit' | 'focus' | 'routine'
  title: string
  description: string
  unlocked: boolean
  current: number
  target: number
  progress: number
  progressLabel: string
  unlockedAt: number | null
}

import type { TitleState } from '@/lib/titles/definitions'
import type { ChallengeState } from '@/lib/challenges/types'

export interface ProfileData {
  stats: ProfileStats
  progress: ProfileProgress
  achievements: Achievement[]
  titles: TitleState
  challenges: ChallengeState
  xpHistory: {
    daily: number
    weekly: number
    monthly: number
  }
}
