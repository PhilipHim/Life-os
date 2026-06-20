import type {
  WorkItem,
  DailyPlanItem,
  FocusSession,
  CharacterArea,
  JournalEntry,
} from '@/lib/types'
import type { ProductivityScore } from '@/lib/productivity-score'
import type { LifeScoreResult } from '@/lib/life-score'
import type { TrendDirection } from '@/lib/coach/types'
import { getSleepEntries } from '@/lib/db/sleep'
import { getHealthEntries } from '@/lib/db/health'
import { getHealthEvents } from '@/lib/db/health-illness'
import { getJournalEntries } from '@/lib/db/journal'
import { getCharacterAreas } from '@/lib/db/character'
import { getBusinessIdeas } from '@/lib/db/business-ideas'
import { getHabits } from '@/lib/db/habits'
import { getEntries as getHabitEntries } from '@/lib/db/habit-entries'
import { computeSleepAnalytics, computeHealthTrendAnalytics } from '@/lib/life-analytics'
import { getWeeklyReport } from '@/lib/weekly'
import { getRecurringTemplates, generateTodayInstances } from '@/lib/recurring'
import { computeHealthScore } from '@/lib/health-score'
import { computeHealthStatus } from '@/lib/db/health-illness'
import { getDailyStats } from '@/lib/analytics'
import { computeTrendDirection } from '@/lib/coach/analysis/trends'

export interface CoachContextInput {
  workItems: WorkItem[]
  planItems: DailyPlanItem[]
  todayPlan: DailyPlanItem[]
  focusSessions: FocusSession[]
  productivityScore: ProductivityScore
  lifeScore: LifeScoreResult | null
  buildDone: number
  buildTotal: number
  avoidSuccess: number
  avoidTotal: number
  activeTaskTitle?: string | null
  nextPriorityTaskTitle?: string | null
}

export interface CoachContext {
  today: string
  productivityScore: ProductivityScore
  lifeScore: LifeScoreResult | null
  sleepScoreToday: number | null
  healthScoreToday: number | null
  sleepAnalytics: ReturnType<typeof computeSleepAnalytics>
  healthAnalytics: ReturnType<typeof computeHealthTrendAnalytics>
  healthStatus: ReturnType<typeof computeHealthStatus>
  habitRate: number
  habitTotal: number
  habitDone: number
  habitWeeklyRate: number | null
  plannerCompletion: number
  plannerTotal: number
  plannerCompleted: number
  plannerTrend: TrendDirection
  activeWorkItems: number
  focusMinutesToday: number
  focusSessionsToday: number
  journalLoggedToday: boolean
  characterAreas: CharacterArea[]
  businessIdeaCount: number
  weeklyReport: ReturnType<typeof getWeeklyReport>
  todaysFocusCandidates: string[]
  recentSleepScores: number[]
  lowSleepStreakDays: number
  lowWaterStreakDays: number
  sleepTrendSeries: number[]
  healthTrendSeries: number[]
  productivityTrendSeries: number[]
  habitTrendSeries: number[]
  sleepTrendDirection: TrendDirection
  healthTrendDirection: TrendDirection
  correlations: {
    sleepTaskCorrelation: number | null
    plannerProductivityCorrelation: number | null
  }
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateStrOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isJournalLoggedToday(entries: JournalEntry[], today: string): boolean {
  const entry = entries.find((e) => e.date === today)
  if (!entry) return false
  const hasText = [
    entry.gratitude, entry.intentions, entry.affirmations, entry.wins,
    entry.lessonsLearned, entry.reflection, entry.tomorrowFocus,
  ].some((t) => t.trim().length > 0)
  return hasText || entry.updatedAt > entry.createdAt
}

function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null
  const n = xs.length
  const meanX = xs.reduce((s, v) => s + v, 0) / n
  const meanY = ys.reduce((s, v) => s + v, 0) / n
  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  const den = Math.sqrt(denX * denY)
  if (den === 0) return null
  return Math.round((num / den) * 100) / 100
}

function buildSeriesForDays(
  daysBack: number,
  getter: (dateStr: string) => number | null
): number[] {
  const series: number[] = []
  for (let i = daysBack; i <= -1; i++) {
    const val = getter(dateStrOffset(i))
    if (val != null) series.push(val)
  }
  return series
}

function computeHabitRateForDate(date: string): number | null {
  const habits = getHabits().filter((h) => h.status === 'active')
  if (habits.length === 0) return null
  const entries = getHabitEntries().filter((e) => e.date === date)

  let successful = 0
  for (const habit of habits) {
    const entry = entries.find((e) => e.habitId === habit.id)
    if (habit.kind === 'build') {
      if (entry?.completed) successful++
    } else if (!entry) {
      successful++
    }
  }

  return Math.round((successful / habits.length) * 100)
}

function computePlannerCompletionForDate(
  date: string,
  planItems: DailyPlanItem[],
  workItems: WorkItem[]
): number | null {
  const dayPlan = planItems.filter((pi) => pi.date === date)
  if (dayPlan.length === 0) return null
  const completed = dayPlan.filter((pi) => {
    const wi = workItems.find((w) => w.id === pi.workItemId)
    return wi?.status === 'completed'
  }).length
  return Math.round((completed / dayPlan.length) * 100)
}

function computeCorrelations(
  sleepEntries: ReturnType<typeof getSleepEntries>,
  planItems: DailyPlanItem[],
  workItems: WorkItem[]
): CoachContext['correlations'] {
  const sleepScores: number[] = []
  const taskCounts: number[] = []
  const plannerRates: number[] = []
  const prodScores: number[] = []

  for (let i = -7; i <= -1; i++) {
    const ds = dateStrOffset(i)
    const sleep = sleepEntries.find((e) => e.date === ds)
    if (sleep) {
      sleepScores.push(sleep.sleepScore)
      const stats = getDailyStats(new Date(ds + 'T12:00:00'))
      taskCounts.push(stats.tasksCompleted)
    }
    const plannerRate = computePlannerCompletionForDate(ds, planItems, workItems)
    if (plannerRate != null) {
      plannerRates.push(plannerRate)
      const stats = getDailyStats(new Date(ds + 'T12:00:00'))
      prodScores.push(stats.score)
    }
  }

  return {
    sleepTaskCorrelation: pearsonCorrelation(sleepScores, taskCounts),
    plannerProductivityCorrelation: pearsonCorrelation(plannerRates, prodScores),
  }
}

export function buildCoachContext(input: CoachContextInput): CoachContext {
  const today = todayLocal()
  const sleepEntries = getSleepEntries()
  const healthEntries = getHealthEntries()
  const healthEvents = getHealthEvents()
  const journalEntries = getJournalEntries()
  const characterAreas = getCharacterAreas()
  const businessIdeas = getBusinessIdeas()

  const sleepAnalytics = computeSleepAnalytics(sleepEntries)
  const healthAnalytics = computeHealthTrendAnalytics(healthEntries, healthEvents)
  const healthStatus = computeHealthStatus(healthEvents, today)
  const weeklyReport = getWeeklyReport()

  const sleepToday = sleepEntries.find((e) => e.date === today)
  const healthToday = healthEntries.find((e) => e.date === today)

  const habitTotal = input.buildTotal + input.avoidTotal
  const habitDone = input.buildDone + input.avoidSuccess
  const habitRate = habitTotal > 0 ? Math.round((habitDone / habitTotal) * 100) : 0

  const plannerTotal = input.productivityScore.planner.total
  const plannerCompleted = input.productivityScore.planner.completed
  const plannerCompletion = input.productivityScore.planner.percentage

  const activeWorkItems = input.workItems.filter(
    (i) => i.type === 'single' && i.status === 'active' && !i.isTemplate && !i.parentId
  ).length

  const todaySessions = input.focusSessions.filter((s) => s.date === today && s.duration > 0)
  const focusMinutesToday = Math.round(todaySessions.reduce((s, sess) => s + sess.duration, 0) / 60000)
  const focusSessionsToday = todaySessions.length

  const recentSleepScores: number[] = []
  for (let i = -1; i >= -7; i--) {
    const ds = dateStrOffset(i)
    const entry = sleepEntries.find((e) => e.date === ds)
    if (entry) recentSleepScores.push(entry.sleepScore)
  }

  let lowSleepStreakDays = 0
  for (let i = -1; i >= -14; i--) {
    const ds = dateStrOffset(i)
    const entry = sleepEntries.find((e) => e.date === ds)
    if (entry && entry.sleepScore < 60) lowSleepStreakDays++
    else if (entry) break
  }

  let lowWaterStreakDays = 0
  for (let i = -1; i >= -14; i--) {
    const ds = dateStrOffset(i)
    const entry = healthEntries.find((e) => e.date === ds)
    if (entry && (entry.waterIntake ?? 0) < 1.5) lowWaterStreakDays++
    else if (entry) break
  }

  const sleepTrendSeries = buildSeriesForDays(-4, (ds) =>
    sleepEntries.find((e) => e.date === ds)?.sleepScore ?? null
  )
  const healthTrendSeries = buildSeriesForDays(-4, (ds) => {
    const entry = healthEntries.find((e) => e.date === ds)
    return entry ? computeHealthScore(entry).total : null
  })
  const productivityTrendSeries = buildSeriesForDays(-4, (ds) => {
    const stats = getDailyStats(new Date(ds + 'T12:00:00'))
    return stats.score
  })
  const habitTrendSeries = buildSeriesForDays(-4, (ds) => computeHabitRateForDate(ds))

  const plannerHistory: number[] = []
  for (let i = -4; i <= -1; i++) {
    const rate = computePlannerCompletionForDate(dateStrOffset(i), input.planItems, input.workItems)
    if (rate != null) plannerHistory.push(rate)
  }
  const plannerTrend = computeTrendDirection(plannerHistory)

  let habitWeeklyRate: number | null = null
  const weeklyHabitRates: number[] = []
  for (let i = -7; i <= -1; i++) {
    const rate = computeHabitRateForDate(dateStrOffset(i))
    if (rate != null) weeklyHabitRates.push(rate)
  }
  if (weeklyHabitRates.length > 0) {
    habitWeeklyRate = Math.round(weeklyHabitRates.reduce((s, v) => s + v, 0) / weeklyHabitRates.length)
  }

  const priorityOrder: Record<string, number> = { H1: 0, H2: 1, M: 2, L: 3 }
  const sortedPlan = [...input.todayPlan].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const recurringToday = generateTodayInstances(getRecurringTemplates(input.workItems))
  const incompleteRecurring = recurringToday.filter((i) => i.instanceStatus === 'active')

  const todaysFocusCandidates: string[] = []
  if (input.activeTaskTitle) todaysFocusCandidates.push(input.activeTaskTitle)
  else {
    const firstIncomplete = sortedPlan.find((pi) => {
      const wi = input.workItems.find((w) => w.id === pi.workItemId)
      return wi?.status !== 'completed'
    })
    if (firstIncomplete) {
      const wi = input.workItems.find((w) => w.id === firstIncomplete.workItemId)
      if (wi) todaysFocusCandidates.push(wi.title)
    }
  }
  if (input.nextPriorityTaskTitle && !todaysFocusCandidates.includes(input.nextPriorityTaskTitle)) {
    todaysFocusCandidates.push(input.nextPriorityTaskTitle)
  }
  for (const r of incompleteRecurring.slice(0, 2)) {
    if (!todaysFocusCandidates.includes(r.title)) todaysFocusCandidates.push(r.title)
  }

  const correlations = computeCorrelations(sleepEntries, input.planItems, input.workItems)

  return {
    today,
    productivityScore: input.productivityScore,
    lifeScore: input.lifeScore,
    sleepScoreToday: sleepToday?.sleepScore ?? null,
    healthScoreToday: healthToday ? computeHealthScore(healthToday).total : null,
    sleepAnalytics,
    healthAnalytics,
    healthStatus,
    habitRate,
    habitTotal,
    habitDone,
    habitWeeklyRate,
    plannerCompletion,
    plannerTotal,
    plannerCompleted,
    plannerTrend,
    activeWorkItems,
    focusMinutesToday,
    focusSessionsToday,
    journalLoggedToday: isJournalLoggedToday(journalEntries, today),
    characterAreas,
    businessIdeaCount: businessIdeas.length,
    weeklyReport,
    todaysFocusCandidates,
    recentSleepScores,
    lowSleepStreakDays,
    lowWaterStreakDays,
    sleepTrendSeries,
    healthTrendSeries,
    productivityTrendSeries,
    habitTrendSeries,
    sleepTrendDirection: computeTrendDirection(sleepTrendSeries),
    healthTrendDirection: computeTrendDirection(healthTrendSeries),
    correlations,
  }
}
