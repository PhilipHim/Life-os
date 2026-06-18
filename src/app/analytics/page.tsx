'use client'

import { useMemo } from 'react'
import { getDailyStats } from '@/lib/analytics'
import { getUnifiedScore, computeHabitScoreForDate } from '@/lib/score'
import { computeHealthScore } from '@/lib/health-score'
import type { HealthScoreResult } from '@/lib/health-score'
import { getWorkItems } from '@/lib/db/work-items'
import { getAllSessions } from '@/lib/focus'
import { getHabits } from '@/lib/db/habits'
import { getEntries } from '@/lib/db/habit-entries'
import { getHealthEntries } from '@/lib/db/health'
import { getJournalEntries } from '@/lib/db/journal'
import { computeLifeScore } from '@/lib/life-score'
import Card from '@/components/ui/Card'

function dateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function dayLabel(date: Date): string {
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function minsStr(m: number): string {
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h > 0) return `${h}h ${r}m`
  return `${r}m`
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
    } else {
      break
    }
  }
  return streak
}

function longestStreakFromDates(dates: string[]): number {
  const sorted = [...new Set(dates)].sort()
  if (sorted.length === 0) return 0
  let maxStreak = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (Math.round(diff) === 1) {
      current++
      maxStreak = Math.max(maxStreak, current)
    } else {
      current = 1
    }
  }
  return maxStreak
}

interface DayOverview {
  date: string
  dayLabel: string
  displayDate: string
  score: number
  focusMinutes: number
  tasksCompleted: number
}

interface Computed {
  weekDays: DayOverview[]
  weeklyAvgScore: number
  totalFocusMinutes: number
  totalTasks: number
  bestDay: DayOverview | null
  worstDay: DayOverview | null
  mostFocusedDay: DayOverview | null
  focusSessions: number
  avgSessionMinutes: number
  longestSessionMs: number
  longestSessionDate: string
  activeSingles: number
  completedSingles: number
  completionRate: number
  avgGroupProgress: number
  totalGroups: number
  habitBuildDone: number
  habitBuildTotal: number
  habitAvoidSuccess: number
  habitAvoidTotal: number
  habitCurrentStreak: number
  habitLongestStreak: number
  avgHealthTotal: number | null
  avgSteps: number | null
  avgWater: number | null
  avgWorkout: number | null
  avgNutrition: number | null
  bestHealthDay: { date: string; score: number } | null
  journalDaysThisWeek: number
  avgMood: number | null
  avgEnergy: number | null
  journalCurrentStreak: number
  journalLongestStreak: number
  lifeWeekScores: { date: string; dayLabel: string; total: number; productivity: number; health: number | null; mind: number }[]
  lifeWeeklyAvg: number
  lifeBestDay: { dayLabel: string; total: number } | null
  lifeWorstDay: { dayLabel: string; total: number } | null
  productivityTrend: number | null
  healthTrend: number | null
  mindTrend: number | null
  bestProductivityDayAllTime: { date: string; score: number } | null
  bestHealthDayAllTime: { date: string; score: number } | null
  longFocusSessionAllTime: { durationMs: number; date: string } | null
  hasData: boolean
  insights: string[]
  lifeInsights: string[]
}

export default function AnalyticsPage() {
  const c = useMemo((): Computed => {
    const workItems = getWorkItems()
    const sessions = getAllSessions()
    const habits = getHabits()
    const entries = getEntries()
    const healthEntries = getHealthEntries()
    const journalEntries = getJournalEntries()

    const today = new Date()
    const dayOfWeek = today.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - diffToMonday)

    const weekDates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      weekDates.push(d)
    }

    const weekDays: DayOverview[] = weekDates.map((d) => {
      const stats = getDailyStats(d)
      return {
        date: dateStr(d),
        dayLabel: dayLabel(d),
        displayDate: formatDate(d),
        score: stats.score,
        focusMinutes: stats.focusMinutes,
        tasksCompleted: stats.tasksCompleted,
      }
    })

    const weeklyAvgScore = Math.round(weekDays.reduce((s, d) => s + d.score, 0) / 7)
    const totalFocusMinutes = weekDays.reduce((s, d) => s + d.focusMinutes, 0)
    const totalTasks = weekDays.reduce((s, d) => s + d.tasksCompleted, 0)

    const sortedByScore = [...weekDays].sort((a, b) => b.score - a.score)
    const bestDay = sortedByScore[0].score > 0 ? sortedByScore[0] : null
    const worstDay = sortedByScore[sortedByScore.length - 1].score < sortedByScore[0].score ? sortedByScore[sortedByScore.length - 1] : null
    const mostFocusedDay = [...weekDays].sort((a, b) => b.focusMinutes - a.focusMinutes)[0].focusMinutes > 0 ? [...weekDays].sort((a, b) => b.focusMinutes - a.focusMinutes)[0] : null

    const singles = workItems.filter((i) => i.type === 'single' && i.status !== 'deleted')
    const activeSingles = singles.filter((i) => i.status === 'active').length
    const completedSingles = singles.filter((i) => i.status === 'completed').length
    const completionRate = singles.length > 0 ? Math.round((completedSingles / singles.length) * 100) : 0

    const groups = workItems.filter((i) => i.type === 'group' && i.status !== 'deleted')
    let totalGroupProgress = 0
    for (const g of groups) {
      const children = g.childrenIds.map((cid) => workItems.find((i) => i.id === cid)).filter(Boolean) as typeof workItems
      const done = children.filter((c) => c.status === 'completed').length
      totalGroupProgress += children.length > 0 ? Math.round((done / children.length) * 100) : 0
    }
    const avgGroupProgress = groups.length > 0 ? Math.round(totalGroupProgress / groups.length) : 0

    const weekStartMs = monday.getTime()
    const weekEndMs = weekStartMs + 7 * 86400000
    const weekSessions = sessions.filter((s) => s.startTime >= weekStartMs && s.startTime < weekEndMs)
    const focusSessions = weekSessions.length
    const avgSessionMinutes = focusSessions > 0 ? Math.round(weekSessions.reduce((s, sess) => s + sess.duration, 0) / focusSessions / 60000) : 0

    let longestSessionMs = 0
    let longestSessionDate = ''
    for (const sess of sessions) {
      if (sess.duration > longestSessionMs) {
        longestSessionMs = sess.duration
        longestSessionDate = sess.date
      }
    }

    const activeHabits = habits.filter((h) => h.status === 'active')
    const buildHabits = activeHabits.filter((h) => h.kind === 'build')
    const avoidHabits = activeHabits.filter((h) => h.kind === 'avoid')
    const todayStr = dateStr(today)
    const todayEntries = entries.filter((e) => e.date === todayStr)

    const habitBuildDone = buildHabits.filter((h) => {
      if (h.type === 'checkbox') return todayEntries.find((e) => e.habitId === h.id)?.completed ?? false
      return todayEntries.find((e) => e.habitId === h.id)?.completed ?? false
    }).length
    const habitBuildTotal = buildHabits.length
    const habitAvoidSuccess = avoidHabits.filter((h) => !todayEntries.find((e) => e.habitId === h.id)).length
    const habitAvoidTotal = avoidHabits.length

    const allEntryDates = [...new Set(entries.map((e) => e.date))]
    const habitCurrentStreak = streakFromDates(allEntryDates)
    const habitLongestStreak = longestStreakFromDates(allEntryDates)

    const weekHealthScores: number[] = []
    let totalSteps = 0
    let totalWater = 0
    let totalWorkout = 0
    let totalNutrition = 0
    let healthDaysWithData = 0
    let bestHealthDayAllTime: { date: string; score: number } | null = null
    let bestHealthThisWeek: { date: string; score: number } | null = null

    for (const h of healthEntries) {
      const result = computeHealthScore(h)
      if (!bestHealthDayAllTime || result.total > bestHealthDayAllTime.score) {
        bestHealthDayAllTime = { date: h.date, score: result.total }
      }
      const hDate = new Date(h.date + 'T00:00:00')
      if (hDate >= monday && hDate < new Date(monday.getTime() + 7 * 86400000)) {
        weekHealthScores.push(result.total)
        totalSteps += h.steps ?? 0
        totalWater += h.waterIntake ?? 0
        totalWorkout += h.workoutMinutes ?? 0
        totalNutrition += h.healthyEatingRating ?? 0
        healthDaysWithData++
        if (!bestHealthThisWeek || result.total > bestHealthThisWeek.score) {
          bestHealthThisWeek = { date: h.date, score: result.total }
        }
      }
    }

    const avgHealthTotal = healthDaysWithData > 0 ? Math.round(weekHealthScores.reduce((s, v) => s + v, 0) / healthDaysWithData) : null
    const avgSteps = healthDaysWithData > 0 ? Math.round(totalSteps / healthDaysWithData) : null
    const avgWater = healthDaysWithData > 0 ? Math.round((totalWater / healthDaysWithData) * 10) / 10 : null
    const avgWorkout = healthDaysWithData > 0 ? Math.round(totalWorkout / healthDaysWithData) : null
    const avgNutrition = healthDaysWithData > 0 ? Math.round((totalNutrition / healthDaysWithData) * 10) / 10 : null

    const journalDatesThisWeek = new Set<string>()
    let totalMood = 0
    let totalEnergy = 0
    let journalDaysWithData = 0
    for (const j of journalEntries) {
      const jDate = new Date(j.date + 'T00:00:00')
      if (jDate >= monday && jDate < new Date(monday.getTime() + 7 * 86400000)) {
        journalDatesThisWeek.add(j.date)
        if (j.mood != null) { totalMood += j.mood; journalDaysWithData++ }
        if (j.energy != null) { totalEnergy += j.energy }
      }
    }
    const journalDaysThisWeek = journalDatesThisWeek.size
    const allJournalDates = [...new Set(journalEntries.map((j) => j.date))]
    const journalCurrentStreak = streakFromDates(allJournalDates)
    const journalLongestStreak = longestStreakFromDates(allJournalDates)
    const avgMood = journalDaysWithData > 0 ? Math.round((totalMood / journalDaysWithData) * 10) / 10 : null
    const avgEnergy = journalDaysWithData > 0 ? Math.round((totalEnergy / journalDaysWithData) * 10) / 10 : null

    let bestProductivityDayAllTime: { date: string; score: number } | null = null
    for (const d of weekDays) {
      if (!bestProductivityDayAllTime || d.score > bestProductivityDayAllTime.score) {
        bestProductivityDayAllTime = { date: d.date, score: d.score }
      }
    }

    const insights: string[] = []
    if (weeklyAvgScore >= 70) {
      insights.push('Strong week — your productivity systems are working well.')
    } else if (weeklyAvgScore < 40) {
      insights.push('Tough week — consider reviewing your workload and eliminating distractions.')
    } else {
      insights.push('Decent week — small adjustments could push your performance higher.')
    }

    if (totalFocusMinutes >= 600) {
      insights.push('Excellent focus volume — you logged over 10 hours of deep work.')
    } else if (totalFocusMinutes < 120) {
      insights.push('Focus was light this week — try scheduling dedicated focus blocks.')
    }

    const totalHabits = habitBuildTotal + habitAvoidTotal
    if (totalHabits > 0) {
      const habitRate = habitBuildTotal > 0 ? Math.round((habitBuildDone / habitBuildTotal) * 100) : 0
      if (habitRate >= 80) {
        insights.push('Habits are on track — your daily routines are building momentum.')
      } else if (habitBuildTotal > 0 && habitRate < 30) {
        insights.push('Build habits need attention — start with one small commitment.')
      }
      if (habitAvoidTotal > 0) {
        if (habitAvoidSuccess === habitAvoidTotal) {
          insights.push('All avoid habits under control today — strong discipline.')
        }
      }
    }

    if (habitCurrentStreak >= 3) {
      insights.push(`You're on a ${habitCurrentStreak}-day habit streak — consistency is compounding.`)
    }
    if (avgHealthTotal != null && avgHealthTotal >= 60) {
      insights.push('Health routines are solid — this fuels your productivity.')
    }
    if (journalDaysThisWeek >= 5) {
      insights.push('Journaling is becoming a habit — reflection strengthens self-awareness.')
    } else if (journalDaysThisWeek >= 3) {
      insights.push('Consistent journaling — try making it a daily practice.')
    }

    const longFocusSessionAllTime = sessions.length > 0
      ? sessions.reduce((best, sess) => sess.duration > best.durationMs ? { durationMs: sess.duration, date: sess.date } : best, { durationMs: 0, date: '' })
      : null

    const lifeWeekScores = weekDates.map((d) => {
      const life = computeLifeScore(d)
      const prod = getUnifiedScore(d)
      return {
        date: dateStr(d),
        dayLabel: dayLabel(d),
        total: life.total,
        productivity: prod.total,
        health: life.health,
        mind: life.mind,
      }
    })
    const lifeWeeklyAvg = lifeWeekScores.length > 0
      ? Math.round(lifeWeekScores.reduce((s, d) => s + d.total, 0) / lifeWeekScores.length)
      : 0
    const sortedLife = [...lifeWeekScores].sort((a, b) => b.total - a.total)
    const lifeBestDay = sortedLife[0].total > 0 ? { dayLabel: sortedLife[0].dayLabel, total: sortedLife[0].total } : null
    const lifeWorstDay = sortedLife[sortedLife.length - 1].total < sortedLife[0].total
      ? { dayLabel: sortedLife[sortedLife.length - 1].dayLabel, total: sortedLife[sortedLife.length - 1].total }
      : null

    const prevMonday = new Date(monday)
    prevMonday.setDate(prevMonday.getDate() - 7)
    const prodAvgs: number[] = []
    const healthAvgs: number[] = []
    const mindAvgs: number[] = []
    const prevProdAvgs: number[] = []
    const prevHealthAvgs: number[] = []
    const prevMindAvgs: number[] = []
    for (const d of weekDates) {
      const life = computeLifeScore(d)
      const prod = getUnifiedScore(d)
      prodAvgs.push(prod.total)
      if (life.health != null) healthAvgs.push(life.health)
      mindAvgs.push(life.mind)
    }
    for (let i = 0; i < 7; i++) {
      const d = new Date(prevMonday)
      d.setDate(d.getDate() + i)
      const life = computeLifeScore(d)
      const prod = getUnifiedScore(d)
      prevProdAvgs.push(prod.total)
      if (life.health != null) prevHealthAvgs.push(life.health)
      prevMindAvgs.push(life.mind)
    }
    const thisAvgProd = prodAvgs.reduce((s, v) => s + v, 0) / prodAvgs.length
    const prevAvgProd = prevProdAvgs.reduce((s, v) => s + v, 0) / prevProdAvgs.length
    const productivityTrend = prevAvgProd > 0
      ? Math.round(((thisAvgProd - prevAvgProd) / prevAvgProd) * 100)
      : null
    const thisAvgHealth = healthAvgs.length > 0 ? healthAvgs.reduce((s, v) => s + v, 0) / healthAvgs.length : 0
    const prevAvgHealth = prevHealthAvgs.length > 0 ? prevHealthAvgs.reduce((s, v) => s + v, 0) / prevHealthAvgs.length : 0
    const healthTrend = prevAvgHealth > 0
      ? Math.round(((thisAvgHealth - prevAvgHealth) / prevAvgHealth) * 100)
      : null
    const thisAvgMind = mindAvgs.reduce((s, v) => s + v, 0) / mindAvgs.length
    const prevAvgMind = prevMindAvgs.reduce((s, v) => s + v, 0) / prevMindAvgs.length
    const mindTrend = prevAvgMind > 0
      ? Math.round(((thisAvgMind - prevAvgMind) / prevAvgMind) * 100)
      : null

    const lifeInsights: string[] = []
    if (lifeBestDay) {
      lifeInsights.push(`Highest Life Score: ${lifeBestDay.dayLabel} (${lifeBestDay.total}/100)`)
    }
    if (lifeWorstDay && lifeBestDay && lifeBestDay.dayLabel !== lifeWorstDay.dayLabel) {
      lifeInsights.push(`Lowest Life Score: ${lifeWorstDay.dayLabel} (${lifeWorstDay.total}/100)`)
    }
    const withScores: { label: string; score: number }[] = [{ label: 'Productivity', score: Math.round(thisAvgProd) }]
    if (healthAvgs.length > 0) withScores.push({ label: 'Health', score: Math.round(thisAvgHealth) })
    withScores.push({ label: 'Mind', score: Math.round(thisAvgMind) })
    withScores.sort((a, b) => b.score - a.score)
    if (withScores.length >= 2 && withScores[0].score > withScores[withScores.length - 1].score) {
      lifeInsights.push(`Strongest category: ${withScores[0].label} (${withScores[0].score}/100)`)
      lifeInsights.push(`Weakest category: ${withScores[withScores.length - 1].label} (${withScores[withScores.length - 1].score}/100)`)
    }

    const hasData = sessions.length > 0 || workItems.length > 0 || habits.length > 0 || healthEntries.length > 0 || journalEntries.length > 0

    return {
      weekDays,
      weeklyAvgScore,
      totalFocusMinutes,
      totalTasks,
      bestDay,
      worstDay,
      mostFocusedDay,
      focusSessions,
      avgSessionMinutes,
      longestSessionMs,
      longestSessionDate,
      activeSingles,
      completedSingles,
      completionRate,
      avgGroupProgress,
      totalGroups: groups.length,
      habitBuildDone,
      habitBuildTotal,
      habitAvoidSuccess,
      habitAvoidTotal,
      habitCurrentStreak,
      habitLongestStreak,
      avgHealthTotal,
      avgSteps,
      avgWater,
      avgWorkout,
      avgNutrition,
      bestHealthDay: bestHealthThisWeek,
      journalDaysThisWeek,
      avgMood,
      avgEnergy,
      journalCurrentStreak,
      journalLongestStreak,
      lifeWeekScores,
      lifeWeeklyAvg,
      lifeBestDay,
      lifeWorstDay,
      productivityTrend,
      healthTrend,
      mindTrend,
      bestProductivityDayAllTime,
      bestHealthDayAllTime,
      longFocusSessionAllTime,
      hasData,
      insights: insights.slice(0, 5),
      lifeInsights,
    }
  }, [])

  if (!c.hasData) {
    return (
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500">Your performance dashboard</p>
        </div>
        <Card>
          <p className="text-gray-400 py-8 text-center">No data yet. Start using the app to see your analytics.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
        <p className="text-gray-500">Your performance dashboard</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Weekly Overview</h2>
        <div className="grid gap-3 sm:grid-cols-7">
          {c.weekDays.map((d) => (
            <Card key={d.date} className="p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">{d.dayLabel}</p>
              <p className={`text-2xl font-bold ${d.score >= 70 ? 'text-green-600' : d.score >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>{d.score}</p>
              <p className="text-xs text-gray-400 mt-1">score</p>
              <p className="text-sm font-medium text-gray-700 mt-2">{minsStr(d.focusMinutes)}</p>
              <p className="text-xs text-gray-400">focus</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{d.tasksCompleted}</p>
              <p className="text-xs text-gray-400">tasks</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 mt-3">
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-400">Weekly Average</p>
            <p className="text-xl font-bold text-gray-900">{c.weeklyAvgScore}<span className="text-sm font-normal text-gray-400">/100</span></p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-400">Total Focus</p>
            <p className="text-xl font-bold text-gray-900">{minsStr(c.totalFocusMinutes)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-400">Tasks Done</p>
            <p className="text-xl font-bold text-gray-900">{c.totalTasks}</p>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Productivity Trend</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {c.bestDay && (
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-green-600 mb-1">Best Day</p>
              <p className="text-lg font-bold text-gray-900">{c.bestDay.dayLabel}</p>
              <p className="text-sm text-gray-500">Score: {c.bestDay.score} · Focus: {minsStr(c.bestDay.focusMinutes)} · Tasks: {c.bestDay.tasksCompleted}</p>
            </Card>
          )}
          {c.worstDay && c.worstDay !== c.bestDay && (
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-red-500 mb-1">Lowest Day</p>
              <p className="text-lg font-bold text-gray-900">{c.worstDay.dayLabel}</p>
              <p className="text-sm text-gray-500">Score: {c.worstDay.score} · Focus: {minsStr(c.worstDay.focusMinutes)} · Tasks: {c.worstDay.tasksCompleted}</p>
            </Card>
          )}
          {c.mostFocusedDay && (
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-600 mb-1">Most Focused</p>
              <p className="text-lg font-bold text-gray-900">{c.mostFocusedDay.dayLabel}</p>
              <p className="text-sm text-gray-500">{minsStr(c.mostFocusedDay.focusMinutes)} of focus · {c.mostFocusedDay.tasksCompleted} tasks</p>
            </Card>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Focus Analytics</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-gray-400">Total Focus Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{minsStr(c.totalFocusMinutes)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Avg Session</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgSessionMinutes}<span className="text-sm font-normal text-gray-400"> min</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Sessions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.focusSessions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Longest Session</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.longestSessionMs > 0 ? minsStr(Math.round(c.longestSessionMs / 60000)) : '-'}</p>
            {c.longestSessionDate && <p className="text-xs text-gray-400 mt-0.5">{c.longestSessionDate}</p>}
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Work Analytics</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-gray-400">Active Singles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.activeSingles}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.completedSingles}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Completion Rate</p>
            <p className={`text-2xl font-bold mt-1 ${c.completionRate >= 70 ? 'text-green-600' : c.completionRate >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>{c.completionRate}<span className="text-sm font-normal text-gray-400">%</span></p>
          </Card>
          {c.totalGroups > 0 && (
            <Card className="p-4">
              <p className="text-xs text-gray-400">Group Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgGroupProgress}<span className="text-sm font-normal text-gray-400">%</span></p>
              <p className="text-xs text-gray-400 mt-0.5">{c.totalGroups} groups</p>
            </Card>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Habit Analytics</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-gray-400">Build Habits Today</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.habitBuildDone}<span className="text-sm font-normal text-gray-400">/{c.habitBuildTotal}</span></p>
          </Card>
          {c.habitAvoidTotal > 0 && (
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avoid Habits</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{c.habitAvoidSuccess}<span className="text-sm font-normal text-gray-400">/{c.habitAvoidTotal} avoided</span></p>
            </Card>
          )}
          <Card className="p-4">
            <p className="text-xs text-gray-400">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.habitCurrentStreak}<span className="text-sm font-normal text-gray-400"> days</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Longest Streak</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.habitLongestStreak}<span className="text-sm font-normal text-gray-400"> days</span></p>
          </Card>
        </div>
      </section>

      {c.avgHealthTotal != null && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Health Analytics</h2>
          <div className="grid gap-4 sm:grid-cols-5">
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Health Score</p>
              <p className={`text-2xl font-bold mt-1 ${c.avgHealthTotal >= 60 ? 'text-green-600' : c.avgHealthTotal >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>{c.avgHealthTotal}<span className="text-sm font-normal text-gray-400">/100</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Steps</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgSteps?.toLocaleString() ?? '-'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Water</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgWater ?? '-'}<span className="text-sm font-normal text-gray-400"> L</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Workout</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgWorkout ?? '-'}<span className="text-sm font-normal text-gray-400"> min</span></p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Nutrition</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgNutrition ?? '-'}<span className="text-sm font-normal text-gray-400">/10</span></p>
            </Card>
          </div>
          {c.bestHealthDay && (
            <p className="text-sm text-gray-500 mt-2">Best health day: {c.bestHealthDay.date} (score: {c.bestHealthDay.score})</p>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Journal Analytics</h2>
        <div className="grid gap-4 sm:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs text-gray-400">Days Journaled</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.journalDaysThisWeek}<span className="text-sm font-normal text-gray-400">/7</span></p>
          </Card>
          {c.avgMood != null && (
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Mood</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgMood}<span className="text-sm font-normal text-gray-400">/10</span></p>
            </Card>
          )}
          {c.avgEnergy != null && (
            <Card className="p-4">
              <p className="text-xs text-gray-400">Avg Energy</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.avgEnergy}<span className="text-sm font-normal text-gray-400">/10</span></p>
            </Card>
          )}
          <Card className="p-4">
            <p className="text-xs text-gray-400">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.journalCurrentStreak}<span className="text-sm font-normal text-gray-400"> days</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Longest Streak</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.journalLongestStreak}<span className="text-sm font-normal text-gray-400"> days</span></p>
          </Card>
        </div>
      </section>

      {c.insights.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Insights</h2>
          <Card className="p-5">
            <ul className="space-y-2">
              {c.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Life Analytics</h2>
        <div className="grid gap-3 sm:grid-cols-7 mb-4">
          {c.lifeWeekScores.map((d) => (
            <Card key={d.date} className="p-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">{d.dayLabel}</p>
              <p className={`text-xl font-bold ${d.total >= 70 ? 'text-green-600' : d.total >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>{d.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">life</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-400">Weekly Average</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{c.lifeWeeklyAvg}<span className="text-sm font-normal text-gray-400">/100</span></p>
          </Card>
          {c.lifeBestDay && (
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-400">Best Day</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{c.lifeBestDay.total}</p>
              <p className="text-sm text-gray-500">{c.lifeBestDay.dayLabel}</p>
            </Card>
          )}
          {c.lifeWorstDay && c.lifeWorstDay.dayLabel !== c.lifeBestDay?.dayLabel && (
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-400">Worst Day</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{c.lifeWorstDay.total}</p>
              <p className="text-sm text-gray-500">{c.lifeWorstDay.dayLabel}</p>
            </Card>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-gray-400">Productivity Trend</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {c.productivityTrend != null ? (
                <span className={c.productivityTrend > 0 ? 'text-green-600' : c.productivityTrend < 0 ? 'text-red-500' : 'text-gray-900'}>
                  {c.productivityTrend > 0 ? '↑' : c.productivityTrend < 0 ? '↓' : '→'} {Math.abs(c.productivityTrend)}%
                </span>
              ) : '—'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Health Trend</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {c.healthTrend != null ? (
                <span className={c.healthTrend > 0 ? 'text-green-600' : c.healthTrend < 0 ? 'text-red-500' : 'text-gray-900'}>
                  {c.healthTrend > 0 ? '↑' : c.healthTrend < 0 ? '↓' : '→'} {Math.abs(c.healthTrend)}%
                </span>
              ) : '—'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-400">Mind Trend</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {c.mindTrend != null ? (
                <span className={c.mindTrend > 0 ? 'text-green-600' : c.mindTrend < 0 ? 'text-red-500' : 'text-gray-900'}>
                  {c.mindTrend > 0 ? '↑' : c.mindTrend < 0 ? '↓' : '→'} {Math.abs(c.mindTrend)}%
                </span>
              ) : '—'}
            </p>
          </Card>
        </div>
        {c.lifeInsights.length > 0 && (
          <Card className="p-4 mt-4">
            <ul className="space-y-1.5">
              {c.lifeInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Top Performances</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-green-600 mb-1">Best Productivity Day</p>
            {c.bestProductivityDayAllTime ? (
              <>
                <p className="text-lg font-bold text-gray-900">{c.bestProductivityDayAllTime.date}</p>
                <p className="text-sm text-gray-500">Score: {c.bestProductivityDayAllTime.score}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No data</p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-600 mb-1">Longest Focus Session</p>
            {c.longFocusSessionAllTime && c.longFocusSessionAllTime.durationMs > 0 ? (
              <>
                <p className="text-lg font-bold text-gray-900">{minsStr(Math.round(c.longFocusSessionAllTime.durationMs / 60000))}</p>
                <p className="text-sm text-gray-500">{c.longFocusSessionAllTime.date}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No data</p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-purple-600 mb-1">Longest Habit Streak</p>
            <p className="text-lg font-bold text-gray-900">{c.habitLongestStreak}<span className="text-sm font-normal text-gray-400"> days</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-yellow-600 mb-1">Best Health Day</p>
            {c.bestHealthDayAllTime ? (
              <>
                <p className="text-lg font-bold text-gray-900">{c.bestHealthDayAllTime.date}</p>
                <p className="text-sm text-gray-500">Score: {c.bestHealthDayAllTime.score}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No data</p>
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}
