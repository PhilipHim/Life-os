import { getDailyStats } from '@/lib/analytics'
import { computeLifeScore } from '@/lib/life-score'
import { computeHabitScoreForDate } from '@/lib/score'
import { getSleepEntries } from '@/lib/db/sleep'
import { getHealthEntries } from '@/lib/db/health'
import { getHealthEvents, computeHealthStatus } from '@/lib/db/health-illness'
import { getHabits } from '@/lib/db/habits'
import { getEntries as getHabitEntries } from '@/lib/db/habit-entries'
import { getCharacterAreas } from '@/lib/db/character'
import { computeHealthScore } from '@/lib/health-score'

export type TrendDirection = 'Improved' | 'Declined' | 'Stable' | 'Unknown'

export interface Trend30DayMetric {
  label: string
  current: number | null
  previous: number | null
  changePct: number | null
  direction: TrendDirection
  chartData: { label: string; value: number }[]
  hasData: boolean
}

export interface PersonalInsight {
  label: string
  value: string
}

export interface PatternObservation {
  id: string
  message: string
}

export interface AnalyticsInsightsBundle {
  trends30Day: Trend30DayMetric[]
  personalInsights: PersonalInsight[]
  patterns: PatternObservation[]
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function directionFromChange(change: number | null): TrendDirection {
  if (change == null) return 'Unknown'
  if (change >= 3) return 'Improved'
  if (change <= -3) return 'Declined'
  return 'Stable'
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 5) return null
  const n = xs.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  const den = Math.sqrt(dx * dy)
  if (den === 0) return null
  return Math.round((num / den) * 100) / 100
}

function bucketChart(values: number[], buckets = 6): { label: string; value: number }[] {
  if (values.length === 0) return []
  const size = Math.ceil(values.length / buckets)
  const result: { label: string; value: number }[] = []
  for (let i = 0; i < buckets; i++) {
    const slice = values.slice(i * size, (i + 1) * size)
    if (slice.length === 0) break
    const a = avg(slice)
    result.push({
      label: i === buckets - 1 ? 'Now' : `W${i + 1}`,
      value: a != null ? Math.round(a) : 0,
    })
  }
  return result
}

function buildTrendMetric(
  label: string,
  getValue: (d: Date) => number | null,
  daysBack = 60
): Trend30DayMetric {
  const currentVals: number[] = []
  const previousVals: number[] = []
  const last30Chart: number[] = []

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const v = getValue(d)
    if (v == null) continue
    if (i < 30) {
      currentVals.push(v)
      last30Chart.push(v)
    } else {
      previousVals.push(v)
    }
  }

  const current = avg(currentVals)
  const previous = avg(previousVals)
  const changePct =
    current != null && previous != null ? pctChange(current, previous) : null

  return {
    label,
    current,
    previous,
    changePct,
    direction: directionFromChange(changePct),
    chartData: bucketChart(last30Chart),
    hasData: currentVals.length >= 3,
  }
}

function isHabitSuccess(habitId: string, kind: 'build' | 'avoid', date: string): boolean {
  const entry = getHabitEntries().find((e) => e.habitId === habitId && e.date === date)
  if (kind === 'build') return entry?.completed ?? false
  return !entry
}

function computeHabitStreak(habitId: string, kind: 'build' | 'avoid'): number {
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 365; i++) {
    const ds = dateStr(d)
    if (isHabitSuccess(habitId, kind, ds)) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

function computeHabitConsistency30d(): { name: string; rate: number } | null {
  const habits = getHabits().filter((h) => h.status === 'active')
  if (habits.length === 0) return null

  let best: { name: string; rate: number } | null = null

  for (const habit of habits) {
    let success = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      if (isHabitSuccess(habit.id, habit.kind, dateStr(d))) success++
    }
    const rate = Math.round((success / 30) * 100)
    if (!best || rate > best.rate) best = { name: habit.title, rate }
  }
  return best
}

function computeLongestHabitStreak(): { name: string; streak: number } | null {
  const habits = getHabits().filter((h) => h.status === 'active')
  let best: { name: string; streak: number } | null = null
  for (const h of habits) {
    const streak = computeHabitStreak(h.id, h.kind)
    if (!best || streak > best.streak) best = { name: h.title, streak }
  }
  return best
}

function buildPersonalInsights(): PersonalInsight[] {
  const insights: PersonalInsight[] = []
  const today = dateStr(new Date())

  let bestProd: { label: string; score: number } | null = null
  let worstProd: { label: string; score: number } | null = null

  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const stats = getDailyStats(d)
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (stats.score > 0) {
      if (!bestProd || stats.score > bestProd.score) bestProd = { label, score: stats.score }
      if (!worstProd || stats.score < worstProd.score) worstProd = { label, score: stats.score }
    }
  }

  if (bestProd) {
    insights.push({ label: 'Most Productive Day', value: `${bestProd.label} (${bestProd.score}/100)` })
  }
  if (worstProd && worstProd.label !== bestProd?.label) {
    insights.push({ label: 'Least Productive Day', value: `${worstProd.label} (${worstProd.score}/100)` })
  }

  const longestHabit = computeLongestHabitStreak()
  if (longestHabit && longestHabit.streak > 0) {
    insights.push({
      label: 'Longest Habit Streak',
      value: `"${longestHabit.name}" — ${longestHabit.streak} days`,
    })
  }

  const healthStatus = computeHealthStatus(getHealthEvents(), today)
  insights.push({
    label: 'Current Health Streak',
    value: healthStatus.status === 'sick'
      ? 'Currently sick'
      : `${healthStatus.streakDays} days without illness`,
  })

  const consistent = computeHabitConsistency30d()
  if (consistent) {
    insights.push({
      label: 'Most Consistent Habit',
      value: `"${consistent.name}" — ${consistent.rate}% (30 days)`,
    })
  }

  const character = getCharacterAreas().filter((a) => a.status === 'active')
  if (character.length > 0) {
    const sorted = [...character].sort((a, b) => b.level - a.level)
    const monthAgo = Date.now() - 30 * 86400000
    const improved = character
      .filter((a) => a.updatedAt >= monthAgo)
      .sort((a, b) => b.level - a.level)[0]
    insights.push({
      label: 'Most Improved Character Trait',
      value: improved
        ? `${improved.name} (Level ${improved.level}, active this month)`
        : `${sorted[0].name} (Level ${sorted[0].level})`,
    })
    const lowest = sorted[sorted.length - 1]
    insights.push({
      label: 'Lowest Character Trait',
      value: `${lowest.name} (Level ${lowest.level})`,
    })
  }

  return insights
}

function buildPatterns(): PatternObservation[] {
  const patterns: PatternObservation[] = []
  let id = 0

  const sleepScores: number[] = []
  const prodScores: number[] = []
  const lifeScores: number[] = []
  const healthScores: number[] = []
  const habitScores: number[] = []

  for (let i = 30; i >= 1; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = dateStr(d)

    const sleep = getSleepEntries().find((e) => e.date === ds)
    if (sleep) sleepScores.push(sleep.sleepScore)

    const stats = getDailyStats(d)
    prodScores.push(stats.score)
    lifeScores.push(computeLifeScore(d).total)
    habitScores.push(computeHabitScoreForDate(d))

    const health = getHealthEntries().find((e) => e.date === ds)
    if (health) healthScores.push(computeHealthScore(health).total)
  }

  const sleepProdCorr = pearson(
    sleepScores,
    prodScores.slice(prodScores.length - sleepScores.length)
  )
  if (sleepProdCorr != null && sleepProdCorr >= 0.35) {
    patterns.push({
      id: `p-${++id}`,
      message: 'You perform better on days after good sleep.',
    })
  } else if (sleepProdCorr != null && sleepProdCorr <= -0.2) {
    patterns.push({
      id: `p-${++id}`,
      message: 'Productivity drops noticeably when sleep scores fall below your average.',
    })
  }

  const habitLifeCorr = pearson(habitScores, lifeScores)
  if (habitLifeCorr != null && habitLifeCorr >= 0.4) {
    patterns.push({
      id: `p-${++id}`,
      message: 'Habit completion strongly correlates with Life Score.',
    })
  }

  if (healthScores.length >= 5) {
    const alignedProd = prodScores.slice(prodScores.length - healthScores.length)
    const healthProdCorr = pearson(healthScores, alignedProd)
    if (healthProdCorr != null && healthProdCorr >= 0.35) {
      patterns.push({
        id: `p-${++id}`,
        message: 'Higher health scores align with stronger productivity days.',
      })
    } else if (healthProdCorr != null && healthProdCorr <= -0.25) {
      patterns.push({
        id: `p-${++id}`,
        message: 'Productivity drops on low-health days.',
      })
    }
  }

  const highSleepDays = sleepScores.filter((s) => s >= 70).length
  const lowSleepDays = sleepScores.filter((s) => s > 0 && s < 60).length
  if (highSleepDays >= 5 && lowSleepDays >= 3) {
    patterns.push({
      id: `p-${++id}`,
      message: 'Your data shows a clear split between high-sleep and low-sleep performance days.',
    })
  }

  const avgHabit = avg(habitScores)
  const avgLife = avg(lifeScores)
  if (avgHabit != null && avgLife != null && avgHabit >= 60 && avgLife >= 60) {
    patterns.push({
      id: `p-${++id}`,
      message: 'Strong habits and Life Score are both above 60 — your systems are reinforcing each other.',
    })
  }

  if (patterns.length === 0) {
    patterns.push({
      id: `p-${++id}`,
      message: 'Keep logging daily — more data will reveal actionable patterns within 2–3 weeks.',
    })
  }

  return patterns.slice(0, 4)
}

export function computeAnalyticsInsights(): AnalyticsInsightsBundle {
  const sleepEntries = getSleepEntries()
  const healthEntries = getHealthEntries()

  const trends30Day: Trend30DayMetric[] = [
    buildTrendMetric('Productivity Score', (d) => getDailyStats(d).score),
    buildTrendMetric('Life Score', (d) => computeLifeScore(d).total),
    buildTrendMetric('Sleep', (d) => {
      const e = sleepEntries.find((s) => s.date === dateStr(d))
      return e?.sleepScore ?? null
    }),
    buildTrendMetric('Health', (d) => {
      const e = healthEntries.find((h) => h.date === dateStr(d))
      return e ? computeHealthScore(e).total : null
    }),
  ]

  return {
    trends30Day,
    personalInsights: buildPersonalInsights(),
    patterns: buildPatterns(),
  }
}
