export type ChallengeModule = 'tasks' | 'habits' | 'journal' | 'sleep' | 'health' | 'focus' | 'planner'
export type ChallengePeriod = 'daily' | 'weekly'

export interface ChallengeInstance {
  id: string
  templateId: string
  period: ChallengePeriod
  periodKey: string
  module: ChallengeModule
  title: string
  description: string
  target: number
  xpReward: number
  current: number
  progress: number
  completed: boolean
  completedAt: number | null
  meta: Record<string, number>
}

export interface ChallengeState {
  daily: ChallengeInstance[]
  weekly: ChallengeInstance[]
  dailyCompleted: number
  weeklyCompleted: number
  dailyXpAvailable: number
  dailyXpEarned: number
  weeklyXpAvailable: number
  weeklyXpEarned: number
}

export interface GenerationContext {
  today: string
  weekDates: string[]
  activeHabitCount: number
  avgDailyTasks: number
  avgWeeklyTasks: number
  hasSleepHistory: boolean
  hasHealthHistory: boolean
  hasFocusHistory: boolean
  recentTemplateIds: string[]
}

export interface ProgressContext {
  today: string
  weekDates: string[]
}
