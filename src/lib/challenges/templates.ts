import type { ChallengeModule, ChallengePeriod, GenerationContext, ProgressContext } from '@/lib/challenges/types'
import {
  countTasksOnDate,
  countTasksInWeek,
  countHabitSuccessesOnDate,
  countHabitSuccessesInWeek,
  countJournalOnDate,
  countJournalInWeek,
  getSleepScoreOnDate,
  hasSleepLoggedOnDate,
  countSleepDaysAboveScore,
  hasHealthLoggedOnDate,
  countWorkoutsInWeek,
} from '@/lib/challenges/progress'

export interface ChallengeTemplate {
  id: string
  module: ChallengeModule
  period: ChallengePeriod
  title: (target: number, meta: Record<string, number>) => string
  description: (target: number, meta: Record<string, number>) => string
  xpReward: (target: number, meta: Record<string, number>) => number
  pickTarget: (ctx: GenerationContext) => { target: number; meta: Record<string, number> } | null
  computeCurrent: (target: number, meta: Record<string, number>, ctx: ProgressContext) => number
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'daily_tasks',
    module: 'tasks',
    period: 'daily',
    title: (t) => `Complete ${t} Task${t === 1 ? '' : 's'}`,
    description: (t) => `Finish ${t} task${t === 1 ? '' : 's'} today.`,
    xpReward: (t) => 30 + t * 10,
    pickTarget: (ctx) => {
      const target = clamp(Math.max(2, Math.round(ctx.avgDailyTasks)), 2, 5)
      return { target, meta: {} }
    },
    computeCurrent: (_t, _m, ctx) => countTasksOnDate(ctx.today),
  },
  {
    id: 'daily_journal',
    module: 'journal',
    period: 'daily',
    title: () => 'Write a Journal Entry',
    description: () => 'Save a journal entry for today.',
    xpReward: () => 20,
    pickTarget: () => ({ target: 1, meta: {} }),
    computeCurrent: (_t, _m, ctx) => countJournalOnDate(ctx.today),
  },
  {
    id: 'daily_habits',
    module: 'habits',
    period: 'daily',
    title: (t) => `Complete ${t} Habit${t === 1 ? '' : 's'}`,
    description: (t) => `Mark ${t} active habit${t === 1 ? '' : 's'} successful today.`,
    xpReward: (t) => 20 + t * 10,
    pickTarget: (ctx) => {
      if (ctx.activeHabitCount === 0) return null
      const target = clamp(Math.min(3, ctx.activeHabitCount), 1, 3)
      return { target, meta: {} }
    },
    computeCurrent: (_t, _m, ctx) => countHabitSuccessesOnDate(ctx.today),
  },
  {
    id: 'daily_sleep_log',
    module: 'sleep',
    period: 'daily',
    title: () => 'Log Your Sleep',
    description: () => 'Record sleep data for today.',
    xpReward: () => 25,
    pickTarget: () => ({ target: 1, meta: {} }),
    computeCurrent: (_t, _m, ctx) => (hasSleepLoggedOnDate(ctx.today) ? 1 : 0),
  },
  {
    id: 'daily_sleep_score',
    module: 'sleep',
    period: 'daily',
    title: (t, meta) => `Reach Sleep Score ${meta.minScore ?? 75}+`,
    description: (t, meta) => `Log sleep with a score of at least ${meta.minScore ?? 75} today.`,
    xpReward: () => 35,
    pickTarget: (ctx) => {
      if (!ctx.hasSleepHistory) return null
      return { target: 1, meta: { minScore: 75 } }
    },
    computeCurrent: (_t, meta, ctx) => {
      const score = getSleepScoreOnDate(ctx.today)
      return score != null && score >= (meta.minScore ?? 75) ? 1 : 0
    },
  },
  {
    id: 'daily_health_log',
    module: 'health',
    period: 'daily',
    title: () => 'Log Health Data',
    description: () => 'Record health metrics for today.',
    xpReward: () => 25,
    pickTarget: () => ({ target: 1, meta: {} }),
    computeCurrent: (_t, _m, ctx) => (hasHealthLoggedOnDate(ctx.today) ? 1 : 0),
  },
  {
    id: 'weekly_tasks',
    module: 'tasks',
    period: 'weekly',
    title: (t) => `Complete ${t} Tasks`,
    description: (t) => `Finish ${t} tasks this week.`,
    xpReward: (t) => 80 + t * 5,
    pickTarget: (ctx) => {
      const target = clamp(Math.max(10, Math.round(ctx.avgWeeklyTasks * 1.5)), 10, 30)
      return { target, meta: {} }
    },
    computeCurrent: (_t, _m, ctx) => countTasksInWeek(ctx.weekDates),
  },
  {
    id: 'weekly_journal',
    module: 'journal',
    period: 'weekly',
    title: (t) => `Write ${t} Journal Entries`,
    description: (t) => `Save journal entries on ${t} different days this week.`,
    xpReward: (t) => 50 + t * 10,
    pickTarget: () => {
      const target = clamp(5, 3, 7)
      return { target, meta: {} }
    },
    computeCurrent: (_t, _m, ctx) => countJournalInWeek(ctx.weekDates),
  },
  {
    id: 'weekly_sleep_consistency',
    module: 'sleep',
    period: 'weekly',
    title: (t, meta) => `Maintain Sleep Score ${meta.minScore ?? 75}+ for ${t} Days`,
    description: (t, meta) =>
      `Log sleep with a score of at least ${meta.minScore ?? 75} on ${t} days this week.`,
    xpReward: (t) => 70 + t * 10,
    pickTarget: (ctx) => {
      if (!ctx.hasSleepHistory) return null
      const target = clamp(5, 3, 5)
      return { target, meta: { minScore: 75 } }
    },
    computeCurrent: (_t, meta, ctx) =>
      countSleepDaysAboveScore(ctx.weekDates, meta.minScore ?? 75),
  },
  {
    id: 'weekly_habits',
    module: 'habits',
    period: 'weekly',
    title: (t) => `Complete ${t} Habit Days`,
    description: (t) => `Successfully complete habits on ${t} days this week.`,
    xpReward: (t) => 60 + t * 5,
    pickTarget: (ctx) => {
      if (ctx.activeHabitCount === 0) return null
      const target = clamp(Math.min(15, ctx.activeHabitCount * 5), 5, 15)
      return { target, meta: {} }
    },
    computeCurrent: (_t, _m, ctx) => countHabitSuccessesInWeek(ctx.weekDates),
  },
  {
    id: 'weekly_workouts',
    module: 'health',
    period: 'weekly',
    title: (t) => `Log ${t} Workout${t === 1 ? '' : 's'}`,
    description: (t) => `Record ${t} workout${t === 1 ? '' : 's'} this week.`,
    xpReward: (t) => 50 + t * 15,
    pickTarget: (ctx) => {
      if (!ctx.hasHealthHistory) return null
      return { target: 3, meta: {} }
    },
    computeCurrent: (_t, _m, ctx) => countWorkoutsInWeek(ctx.weekDates),
  },
]

export const DAILY_TEMPLATES = CHALLENGE_TEMPLATES.filter((t) => t.period === 'daily')
export const WEEKLY_TEMPLATES = CHALLENGE_TEMPLATES.filter((t) => t.period === 'weekly')

export const MODULE_LABELS: Record<ChallengeModule, string> = {
  tasks: 'Tasks',
  habits: 'Habits',
  journal: 'Journal',
  sleep: 'Sleep',
  health: 'Health',
}
