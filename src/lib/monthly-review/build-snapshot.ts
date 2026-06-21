import { getDailyStats } from '@/lib/analytics'
import { computeLifeScore } from '@/lib/life-score'
import { computeHabitScoreForDate } from '@/lib/score'
import { getSleepEntries } from '@/lib/db/sleep'
import { getHealthEntries } from '@/lib/db/health'
import { getHealthEvents, computeHealthStatus } from '@/lib/db/health-illness'
import { getJournalEntries } from '@/lib/db/journal'
import { getCharacterAreas } from '@/lib/db/character'
import { getAssets, getWatchlistAssets } from '@/lib/db/finance'
import {
  computeFinanceAnalytics,
  computeCharacterAnalytics,
} from '@/lib/life-analytics'
import { computeHealthScore } from '@/lib/health-score'
import type { MonthlyReviewSnapshot, CharacterGrowthItem, TrendDirection, ScoreTrend } from '@/lib/monthly-review/types'

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function datesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const d = new Date(start)
  d.setHours(12, 0, 0, 0)
  const endTime = end.getTime()
  while (d.getTime() <= endTime) {
    dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function computeCharacterGrowth(monthStartMs: number): CharacterGrowthItem[] {
  const areas = getCharacterAreas().filter((a) => a.status === 'active')
  return areas
    .filter((a) => a.updatedAt >= monthStartMs)
    .map((a) => ({
      name: a.name,
      change: a.level >= 3 ? 2 : a.level >= 2 ? 1 : 1,
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 5)
}

export function buildMonthlyReviewSnapshot(): MonthlyReviewSnapshot {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  const monthLabel = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const thisMonthDates = datesInRange(monthStart, today)
  const lastMonthDates = datesInRange(prevMonthStart, prevMonthEnd)

  const prodThis: number[] = []
  const prodLast: number[] = []
  const lifeThis: number[] = []
  const lifeLast: number[] = []
  const habitThis: number[] = []
  const habitLast: number[] = []

  for (const d of thisMonthDates) {
    prodThis.push(getDailyStats(d).score)
    lifeThis.push(computeLifeScore(d).total)
    habitThis.push(computeHabitScoreForDate(d))
  }
  for (const d of lastMonthDates) {
    prodLast.push(getDailyStats(d).score)
    lifeLast.push(computeLifeScore(d).total)
    habitLast.push(computeHabitScoreForDate(d))
  }

  const sleepEntries = getSleepEntries()
  const healthEntries = getHealthEntries()

  const sleepThis = thisMonthDates
    .map((d) => sleepEntries.find((e) => e.date === dateStr(d))?.sleepScore)
    .filter((v): v is number => v != null)
  const sleepLast = lastMonthDates
    .map((d) => sleepEntries.find((e) => e.date === dateStr(d))?.sleepScore)
    .filter((v): v is number => v != null)

  const healthThis = thisMonthDates
    .map((d) => {
      const e = healthEntries.find((h) => h.date === dateStr(d))
      return e ? computeHealthScore(e).total : null
    })
    .filter((v): v is number => v != null)
  const healthLast = lastMonthDates
    .map((d) => {
      const e = healthEntries.find((h) => h.date === dateStr(d))
      return e ? computeHealthScore(e).total : null
    })
    .filter((v): v is number => v != null)

  const thisMonthAvgProd = avg(prodThis) ?? 0
  const lastMonthAvgProd = avg(prodLast) ?? 0
  const thisMonthAvgLife = avg(lifeThis) ?? 0
  const lastMonthAvgLife = avg(lifeLast) ?? 0
  const thisMonthAvgSleep = avg(sleepThis)
  const lastMonthAvgSleep = avg(sleepLast)
  const thisMonthAvgHealth = avg(healthThis)
  const lastMonthAvgHealth = avg(healthLast)

  const character = computeCharacterAnalytics(getCharacterAreas())
  const finance = computeFinanceAnalytics(getAssets(), getWatchlistAssets())
  const healthStatus = computeHealthStatus(getHealthEvents(), dateStr(today))

  const journalThisMonth = getJournalEntries().filter((j) => {
    const jd = new Date(j.date + 'T12:00:00')
    return jd >= monthStart && jd <= today
  })
  const moods = journalThisMonth.filter((j) => j.mood != null).map((j) => j.mood)
  const avgMood = moods.length > 0
    ? Math.round((moods.reduce((s, v) => s + v, 0) / moods.length) * 10) / 10
    : null

  return {
    monthLabel,
    daysTrackedThisMonth: thisMonthDates.length,
    productivity: {
      thisMonthAvg: Math.round(thisMonthAvgProd),
      lastMonthAvg: Math.round(lastMonthAvgProd),
      change: pctChange(thisMonthAvgProd, lastMonthAvgProd),
    },
    lifeScore: {
      thisMonthAvg: Math.round(thisMonthAvgLife),
      lastMonthAvg: Math.round(lastMonthAvgLife),
      change: pctChange(thisMonthAvgLife, lastMonthAvgLife),
    },
    sleep: {
      thisMonthAvg: thisMonthAvgSleep != null ? Math.round(thisMonthAvgSleep) : null,
      lastMonthAvg: lastMonthAvgSleep != null ? Math.round(lastMonthAvgSleep) : null,
      change:
        thisMonthAvgSleep != null && lastMonthAvgSleep != null
          ? pctChange(thisMonthAvgSleep, lastMonthAvgSleep)
          : null,
    },
    health: {
      thisMonthAvg: thisMonthAvgHealth != null ? Math.round(thisMonthAvgHealth) : null,
      lastMonthAvg: lastMonthAvgHealth != null ? Math.round(lastMonthAvgHealth) : null,
      change:
        thisMonthAvgHealth != null && lastMonthAvgHealth != null
          ? pctChange(thisMonthAvgHealth, lastMonthAvgHealth)
          : null,
    },
    character: {
      traitsUpdatedThisMonth: character.traitsUpdatedThisMonth,
      growth: computeCharacterGrowth(monthStart.getTime()),
      strongestTrait: character.bestImproving?.name ?? null,
      weakestTrait: character.weakest?.name ?? null,
    },
    finance: {
      portfolioMonthPct: finance.portfolioMonthPct,
      portfolioWeekPct: finance.portfolioWeekPct,
      hasData: finance.hasData,
    },
    habits: {
      avgScoreThisMonth: Math.round(avg(habitThis) ?? 0),
      avgScoreLastMonth: Math.round(avg(habitLast) ?? 0),
    },
    journal: {
      daysThisMonth: journalThisMonth.length,
      avgMood,
    },
    illnessFreeDays: healthStatus.streakDays,
  }
}

export function directionFromChange(change: number | null, threshold = 3): TrendDirection {
  if (change == null) return 'Unknown'
  if (change >= threshold) return 'Improved'
  if (change <= -threshold) return 'Declined'
  return 'Stable'
}

export function formatScoreTrend(
  start: number | null,
  end: number | null,
  change: number | null
): ScoreTrend {
  if (start == null && end == null) {
    return { start: null, end: null, direction: 'Unknown', summary: 'No data logged' }
  }
  const s = start ?? end ?? 0
  const e = end ?? start ?? 0
  const direction = directionFromChange(change ?? (e - s))
  const summary = start != null && end != null && start !== end
    ? `${Math.round(s)} → ${Math.round(e)}`
    : end != null
      ? `${Math.round(e)}/100 avg`
      : 'Insufficient data'
  return { start, end, direction, summary }
}
