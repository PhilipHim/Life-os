'use client'

import { useMemo, useState, useEffect } from 'react'
import { getDailyStats } from '@/lib/analytics'
import { getUnifiedScore } from '@/lib/score'
import { computeHealthScore } from '@/lib/health-score'
import { getWorkItems } from '@/database/work-items'
import { getAllSessions } from '@/lib/focus'
import { getHabits } from '@/database/habits'
import { getEntries } from '@/database/habit-entries'
import { getHealthEntries } from '@/database/health'
import { getJournalEntries } from '@/database/journal'
import { getSleepEntries } from '@/database/sleep'
import { getHealthEvents } from '@/database/health-illness'
import { getCharacterAreas } from '@/database/character'
import { getAssets, getWatchlistAssets } from '@/database/finance'
import {
  computeSleepAnalytics,
  computeHealthTrendAnalytics,
  computeCharacterAnalytics,
  computeFinanceAnalytics,
  formatDuration,
  formatPct,
  type SleepAnalytics,
  type HealthTrendAnalytics,
  type CharacterAnalytics,
  type FinanceAnalytics,
} from '@/lib/life-analytics'
import { computeLifeScore } from '@/lib/life-score'
import AnalyticsSection, { StatCard, TrendBadge, TrendHighlightCard } from '@/components/features/analytics/AnalyticsSection'
import { LevelProgressPanel, XpStatCard } from '@/components/features/progression'
import { DayTrendCard } from '@/components/features/strategic'
import { CompassIcon } from '@/design-system/icons'
import { losClasses } from '@/design-system/tokens'
import Card from '@/components/ui/Card'
import ContextualHint from '@/components/features/first-experience/ContextualHint'
import ProgressBar from '@/components/ui/ProgressBar'
import MiniBarChart from '@/components/features/analytics/MiniBarChart'
import AIWeeklyReviewCard from '@/components/features/analytics/AIWeeklyReviewCard'
import { generateWeeklyReviewAsync, buildWeeklyReviewSnapshot, type WeeklyReview } from '@/lib/weekly-review'
import { generateMonthlyReviewAsync, buildMonthlyReviewSnapshot, type MonthlyReview } from '@/lib/monthly-review'
import AIMonthlyReviewCard from '@/components/features/analytics/AIMonthlyReviewCard'
import { computeLifeIntelligence } from '@/lib/life-intelligence'
import LifeIntelligenceSection from '@/components/features/analytics/LifeIntelligenceSection'
import { computeXpAnalytics } from '@/lib/xp'

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
  healthTrendPct: number | null
  mindTrend: number | null
  bestProductivityDayAllTime: { date: string; score: number } | null
  bestHealthDayAllTime: { date: string; score: number } | null
  longFocusSessionAllTime: { durationMs: number; date: string } | null
  hasData: boolean
  insights: string[]
  lifeInsights: string[]
  sleep: SleepAnalytics
  healthAnalytics: HealthTrendAnalytics
  character: CharacterAnalytics
  finance: FinanceAnalytics
}

export default function AnalyticsPage() {
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null)
  const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(true)
  const [weeklyReviewError, setWeeklyReviewError] = useState<string | null>(null)
  const weekLabel = useMemo(() => buildWeeklyReviewSnapshot().weekLabel, [])

  const [monthlyReview, setMonthlyReview] = useState<MonthlyReview | null>(null)
  const [monthlyReviewLoading, setMonthlyReviewLoading] = useState(true)
  const [monthlyReviewError, setMonthlyReviewError] = useState<string | null>(null)
  const monthLabel = useMemo(() => buildMonthlyReviewSnapshot().monthLabel, [])

  const lifeIntelligence = useMemo(() => computeLifeIntelligence(), [])

  useEffect(() => {
    let cancelled = false
    setWeeklyReviewLoading(true)
    generateWeeklyReviewAsync()
      .then(({ review, error }) => {
        if (cancelled) return
        setWeeklyReview(review)
        setWeeklyReviewError(error ?? null)
        setWeeklyReviewLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setWeeklyReviewLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setMonthlyReviewLoading(true)
    generateMonthlyReviewAsync()
      .then(({ review, error }) => {
        if (cancelled) return
        setMonthlyReview(review)
        setMonthlyReviewError(error ?? null)
        setMonthlyReviewLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setMonthlyReviewLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const [xpAnalytics, setXpAnalytics] = useState<ReturnType<typeof computeXpAnalytics> | null>(null)

  useEffect(() => {
    setXpAnalytics(computeXpAnalytics())
    const refresh = () => setXpAnalytics(computeXpAnalytics())
    window.addEventListener('xp-updated', refresh)
    return () => window.removeEventListener('xp-updated', refresh)
  }, [])

  const c = useMemo((): Computed => {
    const workItems = getWorkItems()
    const sessions = getAllSessions()
    const habits = getHabits()
    const entries = getEntries()
    const healthEntries = getHealthEntries()
    const journalEntries = getJournalEntries()
    const sleepEntries = getSleepEntries()
    const healthEvents = getHealthEvents()
    const characterAreas = getCharacterAreas()
    const financeAssets = getAssets()
    const watchlistAssets = getWatchlistAssets()

    const sleep = computeSleepAnalytics(sleepEntries)
    const healthAnalytics = computeHealthTrendAnalytics(healthEntries, healthEvents)
    const character = computeCharacterAnalytics(characterAreas)
    const finance = computeFinanceAnalytics(financeAssets, watchlistAssets)

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
    const healthTrendPct = prevAvgHealth > 0
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

    const hasData = sessions.length > 0 || workItems.length > 0 || habits.length > 0
      || healthEntries.length > 0 || journalEntries.length > 0 || sleepEntries.length > 0
      || characterAreas.length > 0 || financeAssets.length > 0 || watchlistAssets.length > 0

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
      healthTrendPct,
      mindTrend,
      bestProductivityDayAllTime,
      bestHealthDayAllTime,
      longFocusSessionAllTime,
      hasData,
      insights: insights.slice(0, 5),
      lifeInsights,
      sleep,
      healthAnalytics,
      character,
      finance,
    }
  }, [])

  if (!c.hasData) {
    return (
      <div className={`${losClasses.page} space-y-10`}>
        <header className={losClasses.pageHeader}>
          <div className="flex items-center gap-3">
            <CompassIcon size={28} className="text-los-gold" />
            <h1 className={losClasses.pageTitle}>Analytics</h1>
          </div>
          <p className={losClasses.pageSubtitle}>
            Complete ASCEND overview — productivity, health, sleep, character &amp; finance
          </p>
        </header>
        <Card>
          <p className="text-los-text-muted py-8 text-center">No data yet. Start using the app to see your analytics.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${losClasses.page} space-y-12`}>
      <header className={losClasses.pageHeader}>
        <div className="flex items-center gap-3">
          <CompassIcon size={28} className="text-los-gold" />
          <h1 className={losClasses.pageTitle}>Analytics</h1>
        </div>
        <p className={losClasses.pageSubtitle}>
          Strategic intelligence — productivity, health, sleep, character &amp; finance
        </p>
      </header>

      <ContextualHint section="analytics" message="Your long-term progress appears here." />

      <LifeIntelligenceSection report={lifeIntelligence} />

      {weeklyReviewLoading && !weeklyReview && (
        <Card variant="ai" className="p-8 text-center los-ai-surface">
          <p className="text-sm text-los-ai">Generating your AI Weekly Review…</p>
        </Card>
      )}
      {weeklyReview && (
        <AIWeeklyReviewCard
          review={weeklyReview}
          weekLabel={weekLabel}
          loading={weeklyReviewLoading}
          error={weeklyReviewError}
        />
      )}

      {monthlyReviewLoading && !monthlyReview && (
        <Card variant="ai" className="p-8 text-center los-ai-surface">
          <p className="text-sm text-los-ai">Generating your AI Monthly Review…</p>
        </Card>
      )}
      {monthlyReview && (
        <AIMonthlyReviewCard
          review={monthlyReview}
          monthLabel={monthLabel}
          loading={monthlyReviewLoading}
          error={monthlyReviewError}
        />
      )}

      {xpAnalytics && (
        <AnalyticsSection
          title="Level & XP"
          subtitle="Progression, level milestones, and XP growth"
          hasData={xpAnalytics.hasData}
          emptyMessage="Complete tasks, habits, and ASCEND activities to earn XP."
        >
          <LevelProgressPanel progress={xpAnalytics.progress} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
            <XpStatCard
              label="Total XP"
              value={xpAnalytics.progress.totalXp.toLocaleString()}
              sublabel={`Level ${xpAnalytics.progress.level + 1} at ${xpAnalytics.nextLevelAt.toLocaleString()} XP`}
              highlight
            />
            <XpStatCard
              label="XP to Next Level"
              value={xpAnalytics.xpRemaining.toLocaleString()}
              sublabel={`${xpAnalytics.progress.progressPct}% complete`}
            />
            <XpStatCard
              label="XP This Week"
              value={`+${xpAnalytics.history.weekly}`}
              sublabel={`Today +${xpAnalytics.history.daily} · Month +${xpAnalytics.history.monthly}`}
            />
            <XpStatCard
              label="This Level"
              value={`${xpAnalytics.progress.currentXp.toLocaleString()} / ${xpAnalytics.progress.xpToNextLevel.toLocaleString()}`}
              sublabel="XP toward next level"
            />
          </div>

          <Card className="p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="los-section-label">Level Progress</p>
              <p className="text-xs font-medium tabular-nums text-los-gold">
                {xpAnalytics.progress.progressPct}%
              </p>
            </div>
            <ProgressBar value={xpAnalytics.progress.progressPct} variant="gold" size="lg" />
            <p className="mt-2 text-xs text-los-text-muted tabular-nums">
              {xpAnalytics.progress.currentXp.toLocaleString()} / {xpAnalytics.progress.xpToNextLevel.toLocaleString()} XP
            </p>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-4">
              <p className="los-section-label mb-3">XP Growth (7 days)</p>
              <MiniBarChart
                data={xpAnalytics.xpGrowthWeek.map((p) => ({ label: p.label, value: p.value }))}
                max={Math.max(20, ...xpAnalytics.xpGrowthWeek.map((p) => p.value), 1)}
              />
            </Card>
            <Card className="p-4">
              <p className="los-section-label mb-3">XP Growth (30 days)</p>
              <MiniBarChart
                data={xpAnalytics.xpGrowthMonth.filter((_, i) => i % 5 === 0).map((p) => ({
                  label: p.label,
                  value: p.value,
                }))}
                max={Math.max(20, ...xpAnalytics.xpGrowthMonth.map((p) => p.value), 1)}
              />
            </Card>
          </div>
        </AnalyticsSection>
      )}

      <AnalyticsSection title="Life Overview" subtitle="Weekly Life Score trend">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-7 mb-4">
          {c.lifeWeekScores.map((d) => (
            <DayTrendCard key={d.date} dayLabel={d.dayLabel} score={d.total} meta={['life']} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-4 mb-4">
          <StatCard label="Weekly Average" value={`${c.lifeWeeklyAvg}/100`} highlight />
          {c.lifeBestDay && (
            <StatCard
              label="Best Day"
              value={String(c.lifeBestDay.total)}
              sublabel={c.lifeBestDay.dayLabel}
              valueClassName="text-los-success"
            />
          )}
          {c.lifeWorstDay && c.lifeWorstDay.dayLabel !== c.lifeBestDay?.dayLabel && (
            <StatCard
              label="Lowest Day"
              value={String(c.lifeWorstDay.total)}
              sublabel={c.lifeWorstDay.dayLabel}
              valueClassName="text-los-danger"
            />
          )}
          <StatCard
            label="Mind Trend"
            value={c.mindTrend != null ? `${c.mindTrend > 0 ? '+' : ''}${c.mindTrend}%` : '—'}
            trend={c.mindTrend}
          />
        </div>
        {c.lifeInsights.length > 0 && (
          <Card className="p-4">
            <ul className="space-y-1.5">
              {c.lifeInsights.map((insight) => (
                <li key={insight} className="flex items-start gap-2 text-sm text-los-text-secondary">
                  <span className="text-los-gold mt-0.5 shrink-0">◇</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </AnalyticsSection>

      <AnalyticsSection title="Productivity Analytics" subtitle="Weekly performance, focus & work output">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-7 mb-3">
          {c.weekDays.map((d) => (
            <DayTrendCard
              key={d.date}
              dayLabel={d.dayLabel}
              score={d.score}
              meta={[`${minsStr(d.focusMinutes)} focus`, `${d.tasksCompleted} tasks`]}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          <StatCard label="Weekly Avg Score" value={`${c.weeklyAvgScore}/100`} highlight />
          <StatCard label="Total Focus" value={minsStr(c.totalFocusMinutes)} />
          <StatCard label="Tasks Done" value={String(c.totalTasks)} />
          <StatCard
            label="Completion Rate"
            value={`${c.completionRate}%`}
            valueClassName={
              c.completionRate >= 70
                ? 'text-los-success'
                : c.completionRate >= 40
                  ? 'text-los-warning'
                  : 'text-los-danger'
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Focus Sessions" value={String(c.focusSessions)} sublabel={`Avg ${c.avgSessionMinutes} min`} />
          <StatCard
            label="Longest Session"
            value={c.longestSessionMs > 0 ? minsStr(Math.round(c.longestSessionMs / 60000)) : '—'}
            sublabel={c.longestSessionDate || undefined}
          />
          <StatCard label="Build Habits Today" value={`${c.habitBuildDone}/${c.habitBuildTotal}`} />
          <StatCard
            label="Habit Streak"
            value={`${c.habitCurrentStreak} days`}
            sublabel={`Best: ${c.habitLongestStreak} days`}
          />
        </div>
        {(c.bestDay || c.mostFocusedDay) && (
          <div className="grid gap-3 sm:grid-cols-3 mt-3">
            {c.bestDay && (
              <TrendHighlightCard
                label="Best Day"
                title={c.bestDay.dayLabel}
                detail={`Score ${c.bestDay.score} · ${minsStr(c.bestDay.focusMinutes)} focus`}
                tone="success"
              />
            )}
            {c.mostFocusedDay && (
              <TrendHighlightCard
                label="Most Focused"
                title={c.mostFocusedDay.dayLabel}
                detail={`${minsStr(c.mostFocusedDay.focusMinutes)} of deep work`}
                tone="ai"
              />
            )}
            {c.worstDay && c.worstDay !== c.bestDay && (
              <TrendHighlightCard
                label="Lowest Day"
                title={c.worstDay.dayLabel}
                detail={`Score ${c.worstDay.score}`}
                tone="danger"
              />
            )}
          </div>
        )}
      </AnalyticsSection>

      <AnalyticsSection title="Sleep Analytics" subtitle="Sleep quality, duration & stage trends" hasData={c.sleep.hasData} emptyMessage="No sleep data yet. Log sleep in Life." insights={c.sleep.insights}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          <StatCard label="Avg Sleep Score" value={c.sleep.avgScore != null ? `${c.sleep.avgScore}/100` : '—'} />
          <StatCard label="Avg Duration" value={c.sleep.avgDurationMinutes != null ? formatDuration(Math.round(c.sleep.avgDurationMinutes)) : '—'} />
          <StatCard label="Week vs Month" value={formatPct(c.sleep.weekVsMonthPct)} sublabel={`Week ${c.sleep.weekAvgScore ?? '—'} · Month ${c.sleep.monthAvgScore ?? '—'}`} />
          <StatCard label="Avg REM / Deep" value={c.sleep.avgRemPct != null ? `${c.sleep.avgRemPct}% / ${c.sleep.avgDeepPct}%` : '—'} />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="p-4">
            <p className="los-section-label mb-3">Sleep Score (7 days)</p>
            <MiniBarChart data={c.sleep.weekTrend.map((p) => ({ label: p.label, value: p.value }))} max={100} />
          </Card>
          <Card className="p-4">
            <p className="los-section-label mb-3">
              REM % (<TrendBadge value={c.sleep.remTrendPct} />)
            </p>
            <MiniBarChart
              data={c.sleep.remWeekTrend.map((p) => ({ label: p.label, value: p.value }))}
              max={40}
              unit="%"
              variant="ai"
            />
          </Card>
          <Card className="p-4">
            <p className="los-section-label mb-3">
              Deep Sleep % (<TrendBadge value={c.sleep.deepTrendPct} />)
            </p>
            <MiniBarChart
              data={c.sleep.deepWeekTrend.map((p) => ({ label: p.label, value: p.value }))}
              max={30}
              unit="%"
              variant="ai"
            />
          </Card>
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Health Analytics" subtitle="Health score, wellness trends & illness tracking" hasData={c.healthAnalytics.hasData} emptyMessage="No health data yet. Log health in Life." insights={c.healthAnalytics.insights}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          <StatCard label="Avg Health Score" value={c.healthAnalytics.avgScore != null ? `${c.healthAnalytics.avgScore}/100` : '—'} trend={c.healthAnalytics.scoreTrendPct} valueClassName={c.healthAnalytics.avgScore != null && c.healthAnalytics.avgScore >= 60 ? 'text-los-success' : 'text-los-text-primary'} />
          <StatCard label="Days Without Illness" value={c.healthAnalytics.isSick ? '0' : String(c.healthAnalytics.daysWithoutIllness)} sublabel={c.healthAnalytics.isSick ? 'Currently sick' : 'Healthy streak'} valueClassName={c.healthAnalytics.isSick ? 'text-los-danger' : 'text-los-success'} />
          <StatCard label="Avg Steps" value={c.avgSteps?.toLocaleString() ?? '—'} sublabel="This week" />
          <StatCard label="Avg Water" value={c.avgWater != null ? `${c.avgWater} L` : '—'} sublabel="This week" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="p-4">
            <p className="los-section-label mb-3">Health Score Trend</p>
            <MiniBarChart data={c.healthAnalytics.weekScores.map((p) => ({ label: p.label, value: p.value }))} max={100} colorClass="bg-green-600" />
          </Card>
          <Card className="p-4">
            <p className="los-section-label mb-3">Water Intake (L)</p>
            <MiniBarChart data={c.healthAnalytics.waterTrend.map((p) => ({ label: p.label, value: p.value }))} max={3} colorClass="bg-blue-500" />
          </Card>
          <Card className="p-4">
            <p className="los-section-label mb-3">Exercise (min)</p>
            <MiniBarChart data={c.healthAnalytics.exerciseTrend.map((p) => ({ label: p.label, value: p.value }))} max={60} colorClass="bg-orange-500" />
          </Card>
          <Card className="p-4">
            <p className="los-section-label mb-3">Healthy Eating (/10)</p>
            <MiniBarChart data={c.healthAnalytics.nutritionTrend.map((p) => ({ label: p.label, value: p.value }))} max={10} colorClass="bg-emerald-600" />
          </Card>
        </div>
      </AnalyticsSection>

      <AnalyticsSection title="Character Analytics" subtitle="Personal development & trait progression" hasData={c.character.hasData} emptyMessage="No character traits yet. Add traits in Life." insights={c.character.insights}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          {c.character.bestImproving && <StatCard label="Strongest Trait" value={c.character.bestImproving.name} sublabel={`Level ${c.character.bestImproving.level}/10`} valueClassName="text-los-success" />}
          {c.character.weakest && <StatCard label="Weakest Trait" value={c.character.weakest.name} sublabel={`Level ${c.character.weakest.level}/10`} valueClassName="text-los-warning" />}
          <StatCard label="Monthly Growth" value={`+${c.character.monthlyGrowth}`} sublabel="Levels gained from baseline" />
          <StatCard label="Updated This Month" value={String(c.character.traitsUpdatedThisMonth)} sublabel={`${c.character.traits.length} active traits`} />
        </div>
        <Card className="p-4">
          <p className="los-section-label mb-4">Trait Progression</p>
          <div className="space-y-3">
            {[...c.character.traits].sort((a, b) => b.level - a.level).map((trait) => (
              <div key={trait.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{trait.name}</span>
                  <span className="font-medium text-gray-900 tabular-nums">{trait.level}/10</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gray-900 transition-all duration-500" style={{ width: `${(trait.level / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </AnalyticsSection>

      <AnalyticsSection title="Finance Analytics" subtitle="Portfolio & watchlist performance" hasData={c.finance.hasData} emptyMessage="No finance data yet. Add stocks in Life." insights={c.finance.insights}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
          <StatCard label="Portfolio Today" value={`${c.finance.portfolioDailyPct >= 0 ? '+' : ''}${c.finance.portfolioDailyPct.toFixed(2)}%`} valueClassName={c.finance.portfolioDailyPct >= 0 ? 'text-los-success' : 'text-los-danger'} highlight />
          <StatCard label="Portfolio Week" value={`${c.finance.portfolioWeekPct >= 0 ? '+' : ''}${c.finance.portfolioWeekPct.toFixed(2)}%`} />
          <StatCard label="Portfolio Month" value={`${c.finance.portfolioMonthPct >= 0 ? '+' : ''}${c.finance.portfolioMonthPct.toFixed(2)}%`} />
          <StatCard label="Watchlist Today" value={`${c.finance.watchlistDailyPct >= 0 ? '+' : ''}${c.finance.watchlistDailyPct.toFixed(2)}%`} sublabel={`${c.finance.portfolioCount} held · ${c.finance.watchlistCount} watching`} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.finance.bestPerformer && (
            <Card className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-green-600 mb-1">Best Performer Today</p>
              <p className="text-lg font-bold text-gray-900">{c.finance.bestPerformer.symbol}</p>
              <p className="text-sm text-green-600 tabular-nums">{c.finance.bestPerformer.pct >= 0 ? '+' : ''}{c.finance.bestPerformer.pct.toFixed(2)}%</p>
            </Card>
          )}
          {c.finance.worstPerformer && (
            <Card className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-red-500 mb-1">Worst Performer Today</p>
              <p className="text-lg font-bold text-gray-900">{c.finance.worstPerformer.symbol}</p>
              <p className={`text-sm tabular-nums ${c.finance.worstPerformer.pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>{c.finance.worstPerformer.pct >= 0 ? '+' : ''}{c.finance.worstPerformer.pct.toFixed(2)}%</p>
            </Card>
          )}
        </div>
        {c.finance.portfolioTrend.length > 0 && (
          <Card className="p-4 mt-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-3">Portfolio Price Trend (7 days)</p>
            <MiniBarChart data={c.finance.portfolioTrend.map((p, i) => ({ label: i === c.finance.portfolioTrend.length - 1 ? 'Now' : p.label, value: p.value }))} colorClass="bg-green-600" />
          </Card>
        )}
      </AnalyticsSection>

      <AnalyticsSection title="Journal Analytics" subtitle="Reflection & mindfulness">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Days Journaled" value={`${c.journalDaysThisWeek}/7`} />
          {c.avgMood != null && <StatCard label="Avg Mood" value={`${c.avgMood}/10`} />}
          {c.avgEnergy != null && <StatCard label="Avg Energy" value={`${c.avgEnergy}/10`} />}
          <StatCard label="Current Streak" value={`${c.journalCurrentStreak} days`} />
          <StatCard label="Longest Streak" value={`${c.journalLongestStreak} days`} />
        </div>
      </AnalyticsSection>

      {c.insights.length > 0 && (
        <AnalyticsSection title="Productivity Insights">
          <Card className="p-5">
            <ul className="space-y-2">
              {c.insights.map((insight) => (
                <li key={insight} className="flex items-start gap-2 text-gray-700">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </AnalyticsSection>
      )}

      <AnalyticsSection title="Top Performances" subtitle="All-time highlights">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-green-600 mb-1">Best Productivity Day</p>
            {c.bestProductivityDayAllTime ? (
              <>
                <p className="text-lg font-bold text-gray-900">{c.bestProductivityDayAllTime.date}</p>
                <p className="text-sm text-gray-500">Score: {c.bestProductivityDayAllTime.score}</p>
              </>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600 mb-1">Longest Focus Session</p>
            {c.longFocusSessionAllTime && c.longFocusSessionAllTime.durationMs > 0 ? (
              <>
                <p className="text-lg font-bold text-gray-900">{minsStr(Math.round(c.longFocusSessionAllTime.durationMs / 60000))}</p>
                <p className="text-sm text-gray-500">{c.longFocusSessionAllTime.date}</p>
              </>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-purple-600 mb-1">Longest Habit Streak</p>
            <p className="text-lg font-bold text-gray-900">{c.habitLongestStreak}<span className="text-sm font-normal text-gray-400"> days</span></p>
          </Card>
          <Card className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-yellow-600 mb-1">Best Health Day</p>
            {c.bestHealthDayAllTime ? (
              <>
                <p className="text-lg font-bold text-gray-900">{c.bestHealthDayAllTime.date}</p>
                <p className="text-sm text-gray-500">Score: {c.bestHealthDayAllTime.score}</p>
              </>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </Card>
        </div>
      </AnalyticsSection>
    </div>
  )
}
