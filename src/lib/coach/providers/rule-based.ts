import type { CoachContext } from '@/lib/coach/context'
import type {
  CoachReport,
  DailyCoachReport,
  WeeklyCoachReview,
  WeeklyMetricChange,
  CharacterWeeklyChange,
} from '@/lib/coach/types'
import type { CoachProvider } from '@/lib/coach/providers/types'
import { generateBusinessCoaching } from '@/lib/coach/domains/business'
import { buildCharacterCoach, getBestCharacterImprovement } from '@/lib/coach/domains/character'
import { generateWarnings } from '@/lib/coach/analysis/warnings'
import { generateInsights } from '@/lib/coach/analysis/insights'
import {
  selectBiggestLever,
  computePriority,
  buildTrendMetrics,
} from '@/lib/coach/analysis/priority'

function generateDailyReport(ctx: CoachContext): DailyCoachReport {
  const biggestLever = selectBiggestLever(ctx)
  const priority = computePriority(ctx, biggestLever)
  const warnings = generateWarnings(ctx)
  const insights = generateInsights(ctx)
  const trends = buildTrendMetrics(ctx)
  const characterCoach = buildCharacterCoach(ctx.characterAreas, 3)

  generateBusinessCoaching(ctx)

  return {
    biggestLever,
    priority,
    trends,
    warnings,
    insights,
    characterCoach,
    todaysFocus: [biggestLever.todaysAction],
    advice: [],
    recommendations: [],
    improvements: [],
    primaryRecommendation: biggestLever.context,
    generatedAt: Date.now(),
  }
}

function findWeakestArea(ctx: CoachContext, metrics: WeeklyMetricChange[]): string | null {
  const negative = metrics.filter((m) => m.value < 0).sort((a, b) => a.value - b.value)
  if (negative.length > 0) return negative[0].label

  if (ctx.sleepTrendDirection === 'declining') return 'Sleep'
  if (ctx.plannerTrend === 'declining') return 'Planner'
  if (ctx.habitWeeklyRate != null && ctx.habitWeeklyRate < 60) return 'Habits'
  if (ctx.activeWorkItems >= 12) return 'Task Backlog'

  const lowestTrait = [...ctx.characterAreas]
    .filter((a) => a.status === 'active')
    .sort((a, b) => a.level - b.level)[0]
  return lowestTrait?.name ?? null
}

function buildWeeklySummary(
  ctx: CoachContext,
  weekly: NonNullable<CoachContext['weeklyReport']>,
  weakest: string | null
): { summary: string; nextWeekFocus: string } {
  const prodUp = weekly.scoreTrend >= 5
  const sleepDown = ctx.sleepAnalytics.weekVsMonthPct != null && ctx.sleepAnalytics.weekVsMonthPct <= -5
  const healthUp = ctx.healthAnalytics.scoreTrendPct != null && ctx.healthAnalytics.scoreTrendPct >= 3

  if (prodUp && sleepDown) {
    return {
      summary: 'You are becoming more productive, but recovery quality is falling.',
      nextWeekFocus: 'Focus on sleep next week.',
    }
  }

  if (weekly.scoreTrend >= 8 && !sleepDown) {
    return {
      summary: 'Strong productivity week with balanced recovery.',
      nextWeekFocus: 'Maintain momentum while protecting sleep and habits.',
    }
  }

  if (weekly.scoreTrend <= -8) {
    return {
      summary: 'Productivity dipped this week. Output dropped without a clear recovery trade-off.',
      nextWeekFocus: 'Reset with fewer priorities and earlier bedtimes.',
    }
  }

  if (healthUp && prodUp) {
    return {
      summary: 'Both health and productivity improved — a sustainable growth pattern.',
      nextWeekFocus: 'Keep the current routine and avoid adding scope.',
    }
  }

  if (weakest === 'Sleep') {
    return {
      summary: 'Recovery is the limiting factor this week.',
      nextWeekFocus: 'Prioritize sleep before pushing output harder.',
    }
  }

  if (weakest === 'Habits') {
    return {
      summary: 'Habit consistency slipped — the foundation needs attention.',
      nextWeekFocus: 'Reduce to your 3 most important habits and hit 80% completion.',
    }
  }

  return {
    summary: 'Steady week. Small consistent improvements compound over time.',
    nextWeekFocus: weakest ? `Improve ${weakest} next week.` : 'Protect one bottleneck and one opportunity.',
  }
}

function generateWeeklyReview(ctx: CoachContext): WeeklyCoachReview | null {
  const weekly = ctx.weeklyReport
  if (!weekly) return null

  const metrics: WeeklyMetricChange[] = [
    { label: 'Productivity', value: weekly.scoreTrend, unit: 'percent', category: 'productivity' },
    { label: 'Focus', value: weekly.focusTrend, unit: 'percent', category: 'productivity' },
    { label: 'Tasks', value: weekly.taskTrend, unit: 'percent', category: 'productivity' },
    { label: 'Habits', value: weekly.habitTrend, unit: 'percent', category: 'habits' },
  ]

  if (ctx.sleepAnalytics.weekVsMonthPct != null) {
    metrics.push({
      label: 'Sleep',
      value: ctx.sleepAnalytics.weekVsMonthPct,
      unit: 'percent',
      category: 'sleep',
    })
  }

  if (ctx.healthAnalytics.scoreTrendPct != null) {
    metrics.push({
      label: 'Health',
      value: ctx.healthAnalytics.scoreTrendPct,
      unit: 'percent',
      category: 'health',
    })
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const characterChanges: CharacterWeeklyChange[] = ctx.characterAreas
    .filter((a) => a.updatedAt >= weekAgo && a.status === 'active')
    .map((a) => ({
      name: a.name,
      change: Math.round((a.level > 1 ? (a.level - 1) * 0.15 : 0.1) * 10) / 10,
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 6)

  const bestImprovement =
    getBestCharacterImprovement(ctx.characterAreas) ??
    metrics.filter((m) => m.value > 0).sort((a, b) => b.value - a.value)[0]?.label ??
    null

  const weakestArea = findWeakestArea(ctx, metrics)
  const { summary, nextWeekFocus } = buildWeeklySummary(ctx, weekly, weakestArea)

  const highlights: string[] = []
  if (weekly.scoreTrend >= 5) highlights.push(`Productivity up ${weekly.scoreTrend}% this week.`)
  if (weekly.focusTrend >= 10) highlights.push(`Focus time increased ${weekly.focusTrend}%.`)
  if (ctx.sleepAnalytics.weekVsMonthPct != null && ctx.sleepAnalytics.weekVsMonthPct <= -5) {
    highlights.push(`Sleep down ${Math.abs(ctx.sleepAnalytics.weekVsMonthPct)}% vs monthly average.`)
  }

  return {
    metrics,
    characterChanges,
    bestImprovement,
    weakestArea,
    summary,
    nextWeekFocus,
    highlights,
  }
}

export const ruleBasedCoachProvider: CoachProvider = {
  name: 'rule-based',
  generate(context: CoachContext): CoachReport {
    return {
      daily: generateDailyReport(context),
      weekly: generateWeeklyReview(context),
    }
  },
}
