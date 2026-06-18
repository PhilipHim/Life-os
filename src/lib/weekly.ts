import { getDailyStats, type DailyAnalytics } from '@/lib/analytics'
import { computeHabitScoreForDate } from '@/lib/score'

function dateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export interface WeekData {
  days: DailyAnalytics[]
  totalFocusMinutes: number
  avgScore: number
  totalTasksCompleted: number
  avgHabitScore: number
}

export interface WeeklyReport {
  current: WeekData
  previous: WeekData
  focusTrend: number
  scoreTrend: number
  taskTrend: number
  habitTrend: number
}

function getWeekEnding(date: Date): { start: Date; end: Date } {
  const end = new Date(date)
  const dayOfWeek = end.getDay()
  const diff = dayOfWeek === 0 ? 0 : dayOfWeek
  end.setDate(end.getDate() - diff)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return { start, end }
}

function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function buildWeekData(weekStart: Date): WeekData {
  const dates = getWeekDates(weekStart)
  const days = dates.map((d) => getDailyStats(d))

  const totalFocusMinutes = days.reduce((sum, d) => sum + d.focusMinutes, 0)
  const avgScore = Math.round(days.reduce((sum, d) => sum + d.score, 0) / days.length)
  const totalTasksCompleted = days.reduce((sum, d) => sum + d.tasksCompleted, 0)

  let totalHabit = 0
  for (const d of dates) {
    totalHabit += computeHabitScoreForDate(d)
  }
  const avgHabitScore = Math.round(totalHabit / dates.length)

  return { days, totalFocusMinutes, avgScore, totalTasksCompleted, avgHabitScore }
}

export function getWeeklyReport(): WeeklyReport | null {
  if (typeof window === 'undefined') return null

  const today = new Date()
  const currentStart = new Date(today)
  const dayOfWeek = currentStart.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  currentStart.setDate(currentStart.getDate() - diff - 6)

  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - 7)

  const current = buildWeekData(currentStart)
  const previous = buildWeekData(previousStart)

  const focusTrend = previous.totalFocusMinutes > 0
    ? Math.round(((current.totalFocusMinutes - previous.totalFocusMinutes) / previous.totalFocusMinutes) * 100)
    : 0

  const scoreTrend = previous.avgScore > 0
    ? current.avgScore - previous.avgScore
    : 0

  const taskTrend = previous.totalTasksCompleted > 0
    ? Math.round(((current.totalTasksCompleted - previous.totalTasksCompleted) / previous.totalTasksCompleted) * 100)
    : 0

  const habitTrend = previous.avgHabitScore > 0
    ? current.avgHabitScore - previous.avgHabitScore
    : 0

  return { current, previous, focusTrend, scoreTrend, taskTrend, habitTrend }
}
