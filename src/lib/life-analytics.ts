import type { SleepEntry, HealthEntry, CharacterArea, Asset } from '@/types'
import { computeHealthScore } from '@/lib/health-score'
import { computeHealthStatus } from '@/database/health-illness'
import { computeStockPerformance, computeAggregatedPerformance } from '@/database/finance'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(12, 0, 0, 0)
  return monday
}

function getWeekDates(from: Date, count = 7): Date[] {
  const monday = getMonday(from)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function dayLabel(d: Date): string {
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export interface TrendPoint {
  label: string
  value: number
  date: string
}

export interface SleepAnalytics {
  avgScore: number | null
  avgDurationMinutes: number | null
  avgRemPct: number | null
  avgDeepPct: number | null
  weekTrend: TrendPoint[]
  remWeekTrend: TrendPoint[]
  deepWeekTrend: TrendPoint[]
  weekAvgScore: number | null
  monthAvgScore: number | null
  weekVsMonthPct: number | null
  remTrendPct: number | null
  deepTrendPct: number | null
  hasData: boolean
  insights: string[]
}

export function computeSleepAnalytics(entries: SleepEntry[]): SleepAnalytics {
  const today = new Date()
  const weekDates = getWeekDates(today)
  const prevWeekDates = getWeekDates(new Date(today.getTime() - 7 * 86400000))
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const byDate = new Map(entries.map((e) => [e.date, e]))

  const weekEntries = weekDates.map((d) => byDate.get(dateStr(d))).filter(Boolean) as SleepEntry[]
  const prevWeekEntries = prevWeekDates.map((d) => byDate.get(dateStr(d))).filter(Boolean) as SleepEntry[]
  const monthEntries = entries.filter((e) => new Date(e.date + 'T12:00:00') >= monthStart)

  const weekTrend: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    return { label: dayLabel(d), value: e?.sleepScore ?? 0, date: ds }
  })

  const remWeekTrend: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    const pct = e && e.totalSleepMinutes > 0 ? Math.round((e.remMinutes / e.totalSleepMinutes) * 100) : 0
    return { label: dayLabel(d), value: pct, date: ds }
  })

  const deepWeekTrend: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    const pct = e && e.totalSleepMinutes > 0 ? Math.round((e.deepMinutes / e.totalSleepMinutes) * 100) : 0
    return { label: dayLabel(d), value: pct, date: ds }
  })

  const weekAvgScore = avg(weekEntries.map((e) => e.sleepScore))
  const monthAvgScore = avg(monthEntries.map((e) => e.sleepScore))
  const avgDurationMinutes = avg(weekEntries.map((e) => e.totalSleepMinutes))
  const avgRemPct = avg(
    weekEntries.filter((e) => e.totalSleepMinutes > 0).map((e) => (e.remMinutes / e.totalSleepMinutes) * 100)
  )
  const avgDeepPct = avg(
    weekEntries.filter((e) => e.totalSleepMinutes > 0).map((e) => (e.deepMinutes / e.totalSleepMinutes) * 100)
  )

  const prevRemAvg = avg(
    prevWeekEntries.filter((e) => e.totalSleepMinutes > 0).map((e) => (e.remMinutes / e.totalSleepMinutes) * 100)
  )
  const prevDeepAvg = avg(
    prevWeekEntries.filter((e) => e.totalSleepMinutes > 0).map((e) => (e.deepMinutes / e.totalSleepMinutes) * 100)
  )

  const insights: string[] = []
  if (weekAvgScore != null && weekAvgScore >= 80) {
    insights.push('Excellent sleep quality this week — recovery is supporting your performance.')
  } else if (weekAvgScore != null && weekAvgScore < 50) {
    insights.push('Sleep scores are low — consider earlier bedtime or reducing screen time before sleep.')
  }
  if (weekAvgScore != null && monthAvgScore != null && weekAvgScore > monthAvgScore) {
    insights.push('This week is above your monthly average — sleep habits are improving.')
  }
  if (avgRemPct != null && avgRemPct < 15) {
    insights.push('REM sleep is below optimal range (15–25%) — consistency may help.')
  }

  return {
    avgScore: weekAvgScore,
    avgDurationMinutes,
    avgRemPct: avgRemPct != null ? Math.round(avgRemPct) : null,
    avgDeepPct: avgDeepPct != null ? Math.round(avgDeepPct) : null,
    weekTrend,
    remWeekTrend,
    deepWeekTrend,
    weekAvgScore,
    monthAvgScore,
    weekVsMonthPct: weekAvgScore != null && monthAvgScore != null ? pctChange(weekAvgScore, monthAvgScore) : null,
    remTrendPct: avgRemPct != null && prevRemAvg != null ? pctChange(avgRemPct, prevRemAvg) : null,
    deepTrendPct: avgDeepPct != null && prevDeepAvg != null ? pctChange(avgDeepPct, prevDeepAvg) : null,
    hasData: entries.length > 0,
    insights,
  }
}

export interface HealthTrendAnalytics {
  weekScores: TrendPoint[]
  waterTrend: TrendPoint[]
  exerciseTrend: TrendPoint[]
  nutritionTrend: TrendPoint[]
  avgScore: number | null
  scoreTrendPct: number | null
  daysWithoutIllness: number
  isSick: boolean
  hasData: boolean
  insights: string[]
}

export function computeHealthTrendAnalytics(
  entries: HealthEntry[],
  events: ReturnType<typeof import('@/database/health-illness').getHealthEvents>
): HealthTrendAnalytics {
  const today = new Date()
  const weekDates = getWeekDates(today)
  const prevWeekDates = getWeekDates(new Date(today.getTime() - 7 * 86400000))
  const byDate = new Map(entries.map((e) => [e.date, e]))
  const healthStatus = computeHealthStatus(events, todayLocal())

  const weekScores: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    return { label: dayLabel(d), value: e ? computeHealthScore(e).total : 0, date: ds }
  })

  const waterTrend: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    return { label: dayLabel(d), value: e?.waterIntake ?? 0, date: ds }
  })

  const exerciseTrend: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    return { label: dayLabel(d), value: e?.workoutMinutes ?? 0, date: ds }
  })

  const nutritionTrend: TrendPoint[] = weekDates.map((d) => {
    const ds = dateStr(d)
    const e = byDate.get(ds)
    return { label: dayLabel(d), value: e?.healthyEatingRating ?? 0, date: ds }
  })

  const weekEntries = weekDates.map((d) => byDate.get(dateStr(d))).filter(Boolean) as HealthEntry[]
  const prevWeekEntries = prevWeekDates.map((d) => byDate.get(dateStr(d))).filter(Boolean) as HealthEntry[]

  const avgScore = avg(weekEntries.map((e) => computeHealthScore(e).total))
  const prevAvgScore = avg(prevWeekEntries.map((e) => computeHealthScore(e).total))

  const insights: string[] = []
  if (healthStatus.streakDays >= 7) {
    insights.push(`${healthStatus.streakDays} days without illness — strong wellness streak.`)
  } else if (healthStatus.status === 'sick') {
    insights.push('Currently marked as sick — prioritize rest and recovery.')
  }
  if (avgScore != null && avgScore >= 70) {
    insights.push('Health score is strong this week across your tracked metrics.')
  }

  return {
    weekScores,
    waterTrend,
    exerciseTrend,
    nutritionTrend,
    avgScore,
    scoreTrendPct: avgScore != null && prevAvgScore != null ? pctChange(avgScore, prevAvgScore) : null,
    daysWithoutIllness: healthStatus.streakDays,
    isSick: healthStatus.status === 'sick',
    hasData: entries.length > 0,
    insights,
  }
}

export interface CharacterAnalytics {
  traits: { name: string; level: number; updatedAt: number }[]
  bestImproving: { name: string; level: number } | null
  weakest: { name: string; level: number } | null
  totalLevels: number
  monthlyGrowth: number
  traitsUpdatedThisMonth: number
  hasData: boolean
  insights: string[]
}

export function computeCharacterAnalytics(areas: CharacterArea[]): CharacterAnalytics {
  const active = areas.filter((a) => a.status !== 'deleted')
  const traits = active.map((a) => ({ name: a.name, level: a.level, updatedAt: a.updatedAt }))
  const sorted = [...traits].sort((a, b) => b.level - a.level)
  const weakest = sorted.length > 0 ? sorted[sorted.length - 1] : null

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const updatedThisMonth = active.filter((a) => a.updatedAt >= monthStart.getTime())

  const bestImproving = updatedThisMonth.length > 0
    ? updatedThisMonth.sort((a, b) => b.level - a.level)[0]
    : sorted[0] ?? null

  const totalLevels = active.reduce((s, a) => s + a.level, 0)
  const baselineLevels = active.length
  const monthlyGrowth = totalLevels - baselineLevels

  const insights: string[] = []
  if (bestImproving) {
    insights.push(`${bestImproving.name} is your strongest trait at level ${bestImproving.level}/10.`)
  }
  if (weakest && weakest.level < 5) {
    insights.push(`${weakest.name} could use attention — currently at level ${weakest.level}/10.`)
  }
  if (updatedThisMonth.length > 0) {
    insights.push(`${updatedThisMonth.length} trait${updatedThisMonth.length !== 1 ? 's' : ''} updated this month.`)
  }

  return {
    traits,
    bestImproving: bestImproving ? { name: bestImproving.name, level: bestImproving.level } : null,
    weakest: weakest ? { name: weakest.name, level: weakest.level } : null,
    totalLevels,
    monthlyGrowth,
    traitsUpdatedThisMonth: updatedThisMonth.length,
    hasData: active.length > 0,
    insights,
  }
}

export interface FinanceAnalytics {
  portfolioDailyPct: number
  portfolioWeekPct: number
  portfolioMonthPct: number
  watchlistDailyPct: number
  bestPerformer: { symbol: string; pct: number } | null
  worstPerformer: { symbol: string; pct: number } | null
  portfolioCount: number
  watchlistCount: number
  portfolioTrend: TrendPoint[]
  hasData: boolean
  insights: string[]
}

export function computeFinanceAnalytics(assets: Asset[], watchlist: Asset[]): FinanceAnalytics {
  const portfolioPerf = computeAggregatedPerformance(assets)
  const watchlistPerf = computeAggregatedPerformance(watchlist)

  let bestPerformer: { symbol: string; pct: number } | null = null
  let worstPerformer: { symbol: string; pct: number } | null = null

  for (const asset of assets) {
    const { dailyChangePct } = computeStockPerformance(asset)
    if (!bestPerformer || dailyChangePct > bestPerformer.pct) {
      bestPerformer = { symbol: asset.symbol, pct: dailyChangePct }
    }
    if (!worstPerformer || dailyChangePct < worstPerformer.pct) {
      worstPerformer = { symbol: asset.symbol, pct: dailyChangePct }
    }
  }

  const portfolioTrend: TrendPoint[] = assets.length > 0
    ? assets[0].priceHistory.map((price, i) => ({
        label: `D-${assets[0].priceHistory.length - 1 - i}`,
        value: price,
        date: '',
      }))
    : []

  const insights: string[] = []
  if (assets.length === 0 && watchlist.length === 0) {
    insights.push('Add stocks in Life to track portfolio performance.')
  } else {
    if (portfolioPerf.dailyChangePct > 0) {
      insights.push(`Portfolio up ${portfolioPerf.dailyChangePct.toFixed(2)}% today.`)
    } else if (portfolioPerf.dailyChangePct < 0) {
      insights.push(`Portfolio down ${Math.abs(portfolioPerf.dailyChangePct).toFixed(2)}% today.`)
    }
    if (bestPerformer) {
      insights.push(`Top performer: ${bestPerformer.symbol} (${bestPerformer.pct >= 0 ? '+' : ''}${bestPerformer.pct.toFixed(2)}%).`)
    }
  }

  return {
    portfolioDailyPct: portfolioPerf.dailyChangePct,
    portfolioWeekPct: portfolioPerf.weekChangePct,
    portfolioMonthPct: portfolioPerf.monthChangePct,
    watchlistDailyPct: watchlistPerf.dailyChangePct,
    bestPerformer,
    worstPerformer,
    portfolioCount: assets.length,
    watchlistCount: watchlist.length,
    portfolioTrend,
    hasData: assets.length > 0 || watchlist.length > 0,
    insights,
  }
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatPct(value: number | null): string {
  if (value == null) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}
