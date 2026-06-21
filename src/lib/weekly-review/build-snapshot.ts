import { getDailyStats } from '@/lib/analytics'
import { getWeeklyReport } from '@/lib/weekly'
import { computeLifeScore } from '@/lib/life-score'
import { getSleepEntries } from '@/lib/db/sleep'
import { getHealthEntries } from '@/lib/db/health'
import { getHealthEvents } from '@/lib/db/health-illness'
import { getJournalEntries } from '@/lib/db/journal'
import { getHabits } from '@/lib/db/habits'
import { getEntries as getHabitEntries } from '@/lib/db/habit-entries'
import { getCharacterAreas } from '@/lib/db/character'
import { getAssets, getWatchlistAssets } from '@/lib/db/finance'
import {
  computeSleepAnalytics,
  computeHealthTrendAnalytics,
  computeCharacterAnalytics,
  computeFinanceAnalytics,
} from '@/lib/life-analytics'
import type { WeeklyReviewSnapshot } from '@/lib/weekly-review/types'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function getWeekDates(): { monday: Date; dates: Date[]; label: string } {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - diffToMonday)
  monday.setHours(12, 0, 0, 0)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const label = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return { monday, dates, label }
}

function isHabitSuccessfulOnDate(
  habitId: string,
  kind: 'build' | 'avoid',
  date: string,
  entries: ReturnType<typeof getHabitEntries>
): boolean {
  const entry = entries.find((e) => e.habitId === habitId && e.date === date)
  if (kind === 'build') return entry?.completed ?? false
  return !entry
}

function computeBestHabitWeek(
  weekDateStrs: string[]
): { name: string; completionPct: number } | null {
  const habits = getHabits().filter((h) => h.status === 'active')
  if (habits.length === 0) return null

  const entries = getHabitEntries()
  let best: { name: string; completionPct: number } | null = null

  for (const habit of habits) {
    let success = 0
    for (const ds of weekDateStrs) {
      if (isHabitSuccessfulOnDate(habit.id, habit.kind, ds, entries)) success++
    }
    const rate = Math.round((success / weekDateStrs.length) * 100)
    if (!best || rate > best.completionPct) {
      best = { name: habit.title, completionPct: rate }
    }
  }

  return best
}

function streakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const ds = dateStr(d)
    if (dates.includes(ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

export function buildWeeklyReviewSnapshot(): WeeklyReviewSnapshot {
  const { monday, dates, label } = getWeekDates()
  const weekDateStrs = dates.map(dateStr)
  const weeklyReport = getWeeklyReport()

  const weekDays = dates.map((d) => {
    const stats = getDailyStats(d)
    const life = computeLifeScore(d)
    return {
      day: dayLabel(d),
      productivity: stats.score,
      life: life.total,
      tasks: stats.tasksCompleted,
      focusMinutes: stats.focusMinutes,
    }
  })

  const weeklyAvgScore = weeklyReport?.current.avgScore ?? Math.round(
    weekDays.reduce((s, d) => s + d.productivity, 0) / weekDays.length
  )
  const totalTasks = weekDays.reduce((s, d) => s + d.tasks, 0)
  const totalFocusMinutes = weekDays.reduce((s, d) => s + d.focusMinutes, 0)
  const lifeWeeklyAvg = Math.round(weekDays.reduce((s, d) => s + d.life, 0) / weekDays.length)

  const sortedProd = [...weekDays].sort((a, b) => b.productivity - a.productivity)
  const sortedLife = [...weekDays].sort((a, b) => b.life - a.life)

  const prevMonday = new Date(monday)
  prevMonday.setDate(prevMonday.getDate() - 7)
  const prevLifeScores: number[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(prevMonday)
    d.setDate(prevMonday.getDate() + i)
    prevLifeScores.push(computeLifeScore(d).total)
  }
  const prevLifeAvg = prevLifeScores.reduce((s, v) => s + v, 0) / prevLifeScores.length
  const lifeTrendPct = prevLifeAvg > 0
    ? Math.round(((lifeWeeklyAvg - prevLifeAvg) / prevLifeAvg) * 100)
    : null

  const sleep = computeSleepAnalytics(getSleepEntries())
  const healthAnalytics = computeHealthTrendAnalytics(getHealthEntries(), getHealthEvents())
  const character = computeCharacterAnalytics(getCharacterAreas())
  const finance = computeFinanceAnalytics(getAssets(), getWatchlistAssets())

  const journalEntries = getJournalEntries()
  const journalThisWeek = journalEntries.filter((j) => weekDateStrs.includes(j.date))
  const moods = journalThisWeek.filter((j) => j.mood != null).map((j) => j.mood)
  const avgMood = moods.length > 0
    ? Math.round((moods.reduce((s, v) => s + v, 0) / moods.length) * 10) / 10
    : null

  const allJournalDates = [...new Set(journalEntries.map((j) => j.date))]
  const habitEntries = getHabitEntries()
  const habitStreak = streakFromDates([...new Set(habitEntries.map((e) => e.date))])

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const traitsUpdatedThisWeek = getCharacterAreas().filter(
    (a) => a.status === 'active' && a.updatedAt >= weekAgo
  ).length

  const sleepTrend =
    sleep.weekVsMonthPct != null
      ? sleep.weekVsMonthPct >= 3 ? 'improving' : sleep.weekVsMonthPct <= -3 ? 'declining' : 'stable'
      : 'unknown'

  const bestHabit = computeBestHabitWeek(weekDateStrs)

  return {
    weekLabel: label,
    productivity: {
      weeklyAvgScore,
      trendPct: weeklyReport?.scoreTrend ?? null,
      totalTasks,
      totalFocusMinutes,
      focusTrendPct: weeklyReport?.focusTrend ?? null,
      bestDay: sortedProd[0]?.productivity > 0 ? sortedProd[0].day : null,
    },
    lifeScore: {
      weeklyAvg: lifeWeeklyAvg,
      trendPct: lifeTrendPct,
      bestDay: sortedLife[0]?.life > 0 ? sortedLife[0].day : null,
      weakestDay: sortedLife[sortedLife.length - 1]?.life < sortedLife[0]?.life
        ? sortedLife[sortedLife.length - 1].day
        : null,
    },
    sleep: {
      avgScore: sleep.weekAvgScore,
      weekVsMonthPct: sleep.weekVsMonthPct,
      trend: sleepTrend,
    },
    health: {
      avgScore: healthAnalytics.avgScore,
      trendPct: healthAnalytics.scoreTrendPct,
      daysWithoutIllness: healthAnalytics.daysWithoutIllness,
      isSick: healthAnalytics.isSick,
    },
    habits: {
      weeklyAvgScore: weeklyReport?.current.avgHabitScore ?? 0,
      trend: weeklyReport?.habitTrend ?? 0,
      bestHabit,
      currentStreak: habitStreak,
    },
    journal: {
      daysLogged: journalThisWeek.length,
      avgMood,
      streak: streakFromDates(allJournalDates),
    },
    character: {
      strongestTrait: character.bestImproving?.name ?? null,
      weakestTrait: character.weakest?.name ?? null,
      traitsUpdatedThisWeek,
    },
    finance: {
      portfolioWeekPct: finance.portfolioWeekPct,
      hasData: finance.hasData,
    },
    dailyScores: weekDays.map((d) => ({
      day: d.day,
      productivity: d.productivity,
      life: d.life,
      tasks: d.tasks,
    })),
  }
}
