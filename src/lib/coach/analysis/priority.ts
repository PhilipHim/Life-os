import type { CoachContext } from '@/lib/coach/context'
import type { BiggestLever, CoachPriority, TrendMetric } from '@/lib/coach/types'
import { buildTrendMetric, countConsecutiveDecline, computeTrendDirection } from '@/lib/coach/analysis/trends'

interface LeverCandidate extends BiggestLever {}

function sleepLever(ctx: CoachContext): LeverCandidate | null {
  const declineDays = countConsecutiveDecline(ctx.sleepTrendSeries)
  const score = ctx.sleepScoreToday

  if (declineDays >= 3 || ctx.lowSleepStreakDays >= 3) {
    const days = Math.max(declineDays, ctx.lowSleepStreakDays)
    return {
      title: 'Sleep Recovery',
      category: 'sleep',
      context: `Your sleep score has been declining for ${days} day${days === 1 ? '' : 's'}.`,
      impactAreas: ['Productivity', 'Health', 'Focus'],
      todaysAction: 'Be in bed before 22:30',
      score: 85 + days * 3,
    }
  }

  if (score != null && score < 55) {
    return {
      title: 'Sleep Recovery',
      category: 'sleep',
      context: `Sleep score is critically low at ${score}. Recovery is your highest-leverage move today.`,
      impactAreas: ['Productivity', 'Health', 'Focus'],
      todaysAction: 'Be in bed before 22:30',
      score: 88,
    }
  }

  if (ctx.productivityScore.total >= 70 && score != null && score < 65) {
    return {
      title: 'Sleep Recovery',
      category: 'sleep',
      context: 'Your output is high but recovery is falling. Without sleep, productivity gains will reverse.',
      impactAreas: ['Productivity', 'Health', 'Focus'],
      todaysAction: 'Stop work by 21:00 and prepare for sleep',
      score: 82,
    }
  }

  return null
}

function taskLever(ctx: CoachContext): LeverCandidate | null {
  if (ctx.activeWorkItems < 10) return null

  return {
    title: 'Task Completion',
    category: 'productivity',
    context: `You currently have ${ctx.activeWorkItems} unfinished tasks. Completing existing work will have a greater impact than adding new work.`,
    impactAreas: ['Focus', 'Stress', 'Planner Completion'],
    todaysAction: 'Finish 3 existing tasks before creating new ones',
    score: 70 + Math.min(ctx.activeWorkItems, 20),
  }
}

function habitLever(ctx: CoachContext): LeverCandidate | null {
  if (ctx.habitTotal === 0) return null
  if (ctx.habitWeeklyRate != null && ctx.habitWeeklyRate >= 70) return null

  const rate = ctx.habitWeeklyRate ?? ctx.habitRate
  if (rate >= 70 && ctx.habitRate >= 70) return null

  return {
    title: 'Habit Consistency',
    category: 'habits',
    context: `Habit completion is at ${rate}% — below the consistency threshold that drives compounding results.`,
    impactAreas: ['Life Score', 'Discipline', 'Productivity'],
    todaysAction: 'Complete all remaining habits before opening new work',
    score: 72 + (70 - rate),
  }
}

function healthLever(ctx: CoachContext): LeverCandidate | null {
  if (ctx.healthStatus.status === 'sick') {
    return {
      title: 'Health Recovery',
      category: 'health',
      context: 'You are currently sick. Rest and recovery outperform pushing through today.',
      impactAreas: ['Health', 'Productivity', 'Life Score'],
      todaysAction: 'Reduce workload to essentials only',
      score: 95,
    }
  }

  if (ctx.healthAnalytics.scoreTrendPct != null && ctx.healthAnalytics.scoreTrendPct <= -10) {
    return {
      title: 'Health Recovery',
      category: 'health',
      context: `Health score dropped ${Math.abs(ctx.healthAnalytics.scoreTrendPct)}% this week. Physical recovery supports everything else.`,
      impactAreas: ['Energy', 'Life Score', 'Focus'],
      todaysAction: 'Log health metrics and schedule 30 minutes of movement',
      score: 78,
    }
  }

  if (ctx.lowWaterStreakDays >= 4) {
    return {
      title: 'Hydration Reset',
      category: 'health',
      context: `Hydration has been below target for ${ctx.lowWaterStreakDays} days — a simple fix with outsized impact.`,
      impactAreas: ['Energy', 'Health Score'],
      todaysAction: 'Drink 2L of water before end of day',
      score: 68,
    }
  }

  return null
}

function plannerLever(ctx: CoachContext): LeverCandidate | null {
  if (ctx.plannerTotal < 2) return null
  if (ctx.plannerTrend !== 'declining' && ctx.plannerCompletion >= 50) return null

  return {
    title: 'Planner Execution',
    category: 'planner',
    context: 'You are planning more tasks than you complete. Shrinking the plan increases completion rate.',
    impactAreas: ['Productivity Score', 'Focus', 'Momentum'],
    todaysAction: 'Remove 2 low-priority items from today\'s plan',
    score: 74,
  }
}

function focusLever(ctx: CoachContext): LeverCandidate | null {
  if (ctx.focusMinutesToday >= 45) return null
  if (ctx.productivityScore.focus.totalMinutes >= 120) return null

  const hasPlannedWork = ctx.plannerTotal > 0 || ctx.activeWorkItems > 0
  if (!hasPlannedWork) return null

  return {
    title: 'Deep Focus',
    category: 'productivity',
    context: 'Focus time is low today. One uninterrupted block will move the needle more than scattered effort.',
    impactAreas: ['Task Completion', 'Productivity Score'],
    todaysAction: 'Start one 45-minute focus session on your top priority',
    score: 65,
  }
}

function opportunityLever(ctx: CoachContext): LeverCandidate | null {
  if (ctx.habitWeeklyRate != null && ctx.habitWeeklyRate >= 85 && ctx.habitRate >= 80) {
    return {
      title: 'Momentum Expansion',
      category: 'habits',
      context: 'Habit consistency is strong. This is the window to raise standards or add one high-value habit.',
      impactAreas: ['Life Score', 'Discipline', 'Compounding'],
      todaysAction: 'Identify one habit to level up this week',
      score: 55,
    }
  }

  if (ctx.healthTrendDirection === 'improving' && ctx.productivityScore.total >= 60) {
    return {
      title: 'Health Momentum',
      category: 'health',
      context: 'Health metrics are improving. Doubling down now will accelerate Life Score gains.',
      impactAreas: ['Life Score', 'Energy', 'Productivity'],
      todaysAction: 'Maintain today\'s health routine — consistency beats intensity',
      score: 58,
    }
  }

  return null
}

export function selectBiggestLever(ctx: CoachContext): BiggestLever {
  const candidates = [
    sleepLever(ctx),
    healthLever(ctx),
    taskLever(ctx),
    habitLever(ctx),
    plannerLever(ctx),
    focusLever(ctx),
  ].filter(Boolean) as LeverCandidate[]

  if (candidates.length === 0) {
    const opp = opportunityLever(ctx)
    if (opp) return opp

    const firstTask = ctx.todaysFocusCandidates[0]
    return {
      title: firstTask ? 'Priority Execution' : 'Daily Alignment',
      category: 'productivity',
      context: firstTask
        ? `"${firstTask}" is your highest-impact work today.`
        : 'Set one clear priority and protect time to execute it.',
      impactAreas: ['Productivity', 'Focus'],
      todaysAction: firstTask ?? 'Define and start your single most important task',
      score: 50,
    }
  }

  return candidates.sort((a, b) => b.score - a.score)[0]
}

export function computePriority(ctx: CoachContext, lever: BiggestLever): CoachPriority {
  const bottlenecks: { label: string; category: CoachPriority['biggestBottleneck']['category']; reason: string; score: number }[] = []

  const sleepDecline = countConsecutiveDecline(ctx.sleepTrendSeries)
  if (sleepDecline >= 2 || ctx.lowSleepStreakDays >= 2) {
    bottlenecks.push({
      label: 'Sleep',
      category: 'sleep',
      reason: `Declining for ${Math.max(sleepDecline, ctx.lowSleepStreakDays)} days`,
      score: 80 + sleepDecline,
    })
  }
  if (ctx.activeWorkItems >= 10) {
    bottlenecks.push({
      label: 'Task Backlog',
      category: 'productivity',
      reason: `${ctx.activeWorkItems} unfinished tasks`,
      score: 60 + ctx.activeWorkItems,
    })
  }
  if (ctx.habitWeeklyRate != null && ctx.habitWeeklyRate < 65) {
    bottlenecks.push({
      label: 'Habits',
      category: 'habits',
      reason: `${ctx.habitWeeklyRate}% weekly completion`,
      score: 70,
    })
  }
  if (ctx.plannerTrend === 'declining') {
    bottlenecks.push({
      label: 'Planner',
      category: 'planner',
      reason: 'Completion rate falling',
      score: 68,
    })
  }
  if (ctx.healthAnalytics.scoreTrendPct != null && ctx.healthAnalytics.scoreTrendPct < -5) {
    bottlenecks.push({
      label: 'Health',
      category: 'health',
      reason: `Down ${Math.abs(ctx.healthAnalytics.scoreTrendPct)}% this week`,
      score: 75,
    })
  }

  const opportunities: { label: string; category: CoachPriority['biggestOpportunity']['category']; reason: string; score: number }[] = []

  if (ctx.healthTrendDirection === 'improving') {
    opportunities.push({ label: 'Health', category: 'health', reason: 'Trend improving', score: 70 })
  }
  if (ctx.weeklyReport && ctx.weeklyReport.focusTrend >= 10) {
    opportunities.push({ label: 'Focus', category: 'productivity', reason: `Up ${ctx.weeklyReport.focusTrend}%`, score: 65 })
  }
  if (ctx.habitWeeklyRate != null && ctx.habitWeeklyRate >= 80) {
    opportunities.push({ label: 'Habits', category: 'habits', reason: 'Strong consistency', score: 72 })
  }
  if (ctx.productivityScore.total >= 75) {
    opportunities.push({ label: 'Productivity', category: 'productivity', reason: 'High score today', score: 60 })
  }

  const bottleneck = bottlenecks.sort((a, b) => b.score - a.score)[0] ?? {
    label: lever.title,
    category: lever.category,
    reason: lever.context.slice(0, 60),
    score: lever.score,
  }

  const opportunity = opportunities.sort((a, b) => b.score - a.score)[0] ?? {
    label: 'Consistency',
    category: 'life' as const,
    reason: 'Small daily gains compound',
    score: 40,
  }

  return {
    biggestBottleneck: { label: bottleneck.label, category: bottleneck.category, reason: bottleneck.reason },
    biggestOpportunity: { label: opportunity.label, category: opportunity.category, reason: opportunity.reason },
    mostImportantAction: lever.todaysAction,
  }
}

export function buildTrendMetrics(ctx: CoachContext): TrendMetric[] {
  return [
    buildTrendMetric('Sleep', 'sleep', ctx.sleepTrendSeries),
    buildTrendMetric('Health', 'health', ctx.healthTrendSeries),
    buildTrendMetric('Productivity', 'productivity', ctx.productivityTrendSeries),
    buildTrendMetric('Habits', 'habits', ctx.habitTrendSeries, 'percent'),
  ]
}

export function getSleepTrendDirection(ctx: CoachContext) {
  return computeTrendDirection(ctx.sleepTrendSeries)
}

export function getHealthTrendDirection(ctx: CoachContext) {
  return computeTrendDirection(ctx.healthTrendSeries)
}
